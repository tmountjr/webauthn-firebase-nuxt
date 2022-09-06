/* eslint-disable no-console */
export default {
  onAuthStateChanged ({ commit }, { authUser }) {
    if (!authUser) {
      commit('RESET_STORE')
      return
    }
    // if (authUser.getIdToken) {
    //   try {
    //     const idToken = await authUser.getIdToken(true)
    //   } catch (e) {
    //     console.error(e)
    //   }
    // }
    commit('SET_AUTH_USER', { authUser })
  }
}
