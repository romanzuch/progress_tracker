import { useSessionStore } from "../../src/stores/session.store"

export class ApiError extends Error {
    status: number
    body: unknown

    constructor(status: number, body: unknown) {
        super(`API request failed with status ${status}`)
        this.name = "ApiError"
        this.status = status
        this.body = body
    }
}

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

let onUnauthorized: (() => void) | undefined

export function setUnauthorizedHandler(handler: () => void): void {
    onUnauthorized = handler
}

function isNeedsReauthBody(body: unknown): body is { error: "needs_reauth" } {
    return typeof body === "object" && body !== null && (body as { error?: unknown }).error === "needs_reauth"
}

async function parseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type") ?? ""
    if (contentType.includes("application/json")) {
        return response.json()
    }
    return response.text()
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response

    try {
        response = await fetch(`${apiBaseUrl}${path}`, {
            ...init,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...init.headers
            },
        })
    } catch {
        throw new ApiError(0, { message: "Network error" })
    }

    if (!response.ok) {
        const body = await parseBody(response)

        if (response.status === 401) {
            const sessionStore = useSessionStore()
            if (isNeedsReauthBody(body)) {
                sessionStore.flagNeedsReauth()
            } else {
                sessionStore.markLoggedOut()
                onUnauthorized?.()
            }
        }

        throw new ApiError(response.status, body)
    }

    if (response.status === 204) {
        return undefined as T
    }

    return (await parseBody(response)) as T
}

export const apiClient = {
    get<T>(path: string): Promise<T> {
        return request<T>(path)
    },

    post<T>(path: string, body?: unknown): Promise<T> {
        return request<T>(path, {
            method: "POST",
            body: body === undefined ? undefined : JSON.stringify(body),
        })
    },

    delete<T>(path: string): Promise<T> {
        return request<T>(path, { method: "DELETE" })
    },
}
