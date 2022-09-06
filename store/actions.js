/* eslint-disable no-console */
export default {
  async onAuthStateChanged ({ commit }, { authUser }) {
    if (!authUser) {
      commit('RESET_STORE')
      return
    }
    if (authUser.getIdToken) {
      try {
        const idToken = await authUser.getIdToken(true)
        commit('SET_AUTH_TOKEN', idToken)
      } catch (e) {
        console.error(e)
      }
    }
    commit('SET_AUTH_USER', { authUser })
  }
}
