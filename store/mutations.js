import initialState from './state'

export default {
  RESET_STORE: (state) => {
    Object.assign(state, initialState())
    this.$cookies.remove('authUser')
  },

  SET_AUTH_USER: (state, { authUser }) => {
    state.authUser = {
      uid: authUser.uid,
      email: authUser.email
    }
  },

  SET_AUTH_TOKEN: (state, idToken) => {
    state.idToken = idToken
  }
}
