import { create } from "zustand"
import type { User } from "@/types"

interface UserState {
  users: User[]
  isLoading: boolean
  error: string | null
  fetchUsers: () => Promise<void>
  getUser: (id: string) => Promise<User | undefined>
  createUser: (user: Omit<User, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateUser: (id: string, user: Partial<User>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const users = await response.json()
      set({ users, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  getUser: async (id: string) => {
    const { users } = get()
    let user = users.find((u) => u.id === id)

    if (user) return user

    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/users/${id}`)
      if (!response.ok) throw new Error("Failed to fetch user")
      user = await response.json()
      set({ isLoading: false })
      return user
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return undefined
    }
  },

  createUser: async (userData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })
      if (!response.ok) throw new Error("Failed to create user")
      const newUser = await response.json()
      set((state) => ({
        users: [...state.users, newUser],
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  updateUser: async (id, updatedUserData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUserData),
      })
      if (!response.ok) throw new Error("Failed to update user")
      const updatedUser = await response.json()
      set((state) => ({
        users: state.users.map((user) => (user.id === id ? updatedUser : user)),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete user")
      set((state) => ({
        users: state.users.filter((user) => user.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
}))

