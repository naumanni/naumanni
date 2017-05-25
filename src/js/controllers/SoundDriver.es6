/**
 * 音を再生する
 */
class SoundDriver {
  constructor(soundFiles) {
    this.sounds = Object.keys(soundFiles).reduce((sounds, soundName) => {
      const soundFile = soundFiles[soundName]
      sounds[soundName] = new Audio([soundFile])
      return sounds
    }, {})
  }

  addSound(soundName, soundFile) {
    this.sounds[soundName] = new Audio(soundFile)
  }

  play(soundName) {
    const audio = this.sounds[soundName]

    if(!audio.paused) {
      audio.pause()
      if(audio.fastSeek)
        audio.fastSeek(0)
      else if(audio.currentTime)
        audio.currentTime = 0
    }
    audio.play()
  }
}


export default new SoundDriver({
  'notify': '/static/notify.mp3',
})
