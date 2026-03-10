export function getInitials(username: string, email: string) {
  return (username || email).slice(0, 2).toUpperCase();
}