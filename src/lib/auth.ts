import { apiBaseUrl } from "../../lib/api/client"

export function redirectToBattlenetLogin(): void {
  window.location.href = `${apiBaseUrl}/api/auth/battlenet`
}
