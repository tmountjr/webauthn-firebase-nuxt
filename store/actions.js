/* eslint-disable no-console */
export default {
  async onAuthStateChanged ({ commit }, { authUser }) {
    if (!authUser) {
      commit('RESET_STORE')
      return
    }
    let idToken = null
    if (authUser.getIdToken) {
      try {
        idToken = await authUser.getIdToken(true)
        commit('SET_AUTH_TOKEN', idToken)
      } catch (e) {
        console.error(e)
      }
    }
    commit('SET_AUTH_USER', { authUser })
    const cookie = { authUser }
    if (idToken) { cookie.idToken = idToken }
    this.$cookies.set('authUser', cookie, { maxAge: 60 * 60 * 6 }) // six hours
  }
}
