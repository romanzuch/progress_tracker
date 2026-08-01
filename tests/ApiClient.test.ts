import { afterEach, describe, expect, it, vi } from "vitest"
import { apiClient, ApiError } from "../lib/api/client"

function mockFetch(
    overrides: Partial<{
        ok: boolean
        status: number
        json: () => Promise<unknown>
        text: () => Promise<string>
    }>,
) {
    const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({}),
        text: async () => "",
        ...overrides,
    })
    vi.stubGlobal("fetch", fetchMock)
    return fetchMock
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe("apiClient", () => {
    it("sends every request with credentials: include", async () => {
        const fetchMock = mockFetch({ json: async () => ({ hello: 'world' }) })

        const result = await apiClient.get<{ hello: string }>("/api/ping")

        expect(result).toEqual({ hello: "world" })
        const [, init] = fetchMock.mock.calls[0]
        expect(init.credentials).toBe("include")
    })

    it("throws an ApiError with the response status and parsed JSON body on a non-2xx response", async () => {
        mockFetch({ ok: false, status: 404, json: async () => ({ error: "not_found" }) })
        const failure = apiClient.get("/api/missing")

        await expect(failure).rejects.toBeInstanceOf(ApiError)
        await expect(failure).rejects.toMatchObject({
            status: 404,
            body: { error: "not_found" },
        })
    })

    it("throws ApiError(0, ...) when fetch itself rejects (network failure)", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))

        await expect(apiClient.get("/api/ping")).rejects.toMatchObject({ status: 0 })
    })

    it('serializes the body and sets POST as the method', async () => {
        const fetchMock = mockFetch({ json: async () => ({}) })

        await apiClient.post('/api/things', { name: 'thrall' })

        const [, init] = fetchMock.mock.calls[0]
        expect(init.method).toBe('POST')
        expect(init.body).toBe(JSON.stringify({ name: 'thrall' }))
    })

    it('sets DELETE as the method with no body', async () => {
        const fetchMock = mockFetch({ json: async () => ({}) })

        await apiClient.delete('/api/things/1')

        const [, init] = fetchMock.mock.calls[0]
        expect(init.method).toBe('DELETE')
        expect(init.body).toBeUndefined()
    })

})

