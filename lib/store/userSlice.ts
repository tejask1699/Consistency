import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface UserState {
  id: number | null
  name: string | null
  email: string | null
  avatarUrl?: string | null
  isAuthenticated: boolean
  loading: boolean
}

const initialState: UserState = {
  id: null,
  name: null,
  email: null,
  avatarUrl: null,
  isAuthenticated: false,
  loading: true,
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<{ id: number; name: string; email: string; avatarUrl?: string | null }>
    ) => {
      state.id = action.payload.id
      state.name = action.payload.name
      state.email = action.payload.email
      state.avatarUrl = action.payload.avatarUrl || null
      state.isAuthenticated = true
      state.loading = false
    },
    clearUser: (state) => {
      state.id = null
      state.name = null
      state.email = null
      state.avatarUrl = null
      state.isAuthenticated = false
      state.loading = false
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
  },
})

export const { setUser, clearUser, setLoading } = userSlice.actions
export default userSlice.reducer
