import initialState from './state'

export default {
  RESET_STORE: (state) => {
    Object.assign(state, initialState())
  },

  SET_AUTH_USER: (state, { authUser }) => {
    state.authUser = {
      uid: authUser.uid,
      email: authUser.email,
      emailVerified: authUser.emailVerified
    }
  },

  SET_AUTH_TOKEN: (state, idToken) => {
    state.idToken = idToken
  },

  SET_CREDENTIALS: (state, credentials) => {
    state.credentials = credentials
  }
}
