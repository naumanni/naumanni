/*
 * この階層はRootたるReact.Componentを置く
 * Rootたる = contextを受け取る。 Dashboard, Column, Dialog
 *
 * + components ... 複雑なComponentだけど、contextは受け取らない（必要なものは親からもらう）
 * + parts ... stateが無いか、あっても簡単な小さいやつ
 */
