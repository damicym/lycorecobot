import { TwitterApi } from 'twitter-api-v2'
import ffmpegStatic from 'ffmpeg-static'
import ffmpeg from 'fluent-ffmpeg'
import ffprobe from '@ffprobe-installer/ffprobe'
import { fileURLToPath } from 'url'
import path from "path"
import dotenv from 'dotenv'
//estas 4 cosas de abajo son para el pm2 trigger
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const { exec } = require("child_process")
const pmx = require('@pm2/io')
dotenv.config()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
ffmpeg.setFfmpegPath(ffmpegStatic)
ffmpeg.setFfprobePath(ffprobe.path)

const client = new TwitterApi({
  appKey: process.env.API_KEY,
  appSecret: process.env.API_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_SECRET,
})

const cantCaps = 13
const outputPath = "E:/LycoRecoResources/frames"

function getRandomFrame(videoPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err)

      const duration = metadata.format.duration
      const randomTime = Math.random() * duration
      const now = new Date()
      const filename = `frame-${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} - ${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}.jpg`
      ffmpeg(videoPath)
      .outputOptions(['-q:v 5'])
        .screenshots({
          timestamps: [randomTime],
          filename: filename,
          folder: outputPath,
          size: '1920x1080',
        })
        .on('end', () => resolve([randomTime, path.join(outputPath, filename)]))
        .on('error', reject)
    })
  })
}

async function postTweet() {
  // let waitTime = 0
  try {
    const selectedChapter = getRandomChapter()
    const chapterNum = selectedChapter[0]
    const videoPath = selectedChapter[1]
    const selectedFrame = await getRandomFrame(videoPath, outputPath)
    const frameTime = secondsToTimeFormat(selectedFrame[0])
    const framePath = selectedFrame[1]
    const textPost = `Capítulo ${chapterNum}, minuto ${frameTime}` 
    const mediaId = await client.v1.uploadMedia(framePath)
    const tweet = await client.v2.tweet({
      text: textPost,
      media: { media_ids: [mediaId] }
    })
    console.log("Tweet publicado:", tweet)
  } catch (error) {
    // if (error.response?.status === 429) {
    //   const resetTimestamp = error.response.headers['x-ratelimit-reset']
    //   const currentTime = Math.floor(Date.now() / 1000)
    //   waitTime = (resetTimestamp - currentTime) * 1000
    // } else console.error("Error al publicar el tweet (no es 429):", error)
    console.error("Error al publicar el tweet:", error)
  }
  // return waitTime
}

function getRandomChapter(){
  const randomCapNum = Math.floor(Math.random() * cantCaps) + 1
  const capPath = `E:/LycoRecoResources/videos/chapter${randomCapNum}.mkv`
  return [randomCapNum, capPath]
}
function secondsToTimeFormat(totalSeconds){
  let minutes = Math.floor(totalSeconds / 60)
  let seconds = Math.floor(totalSeconds % 60)
  minutes = String(minutes).padStart(2, "0")
  seconds = String(seconds).padStart(2, "0")
  return `${minutes}:${seconds}`
}

const now = new Date()
const horaDePosteo = new Date()
horaDePosteo.setHours(0, 0, 0, 0)

//postear cada 3hs:
//objetivo: sumarle las horas necesarias para que sea multiplo de 3
let restoHoras = now.getHours() % 3
let horasRestantes = 3 - restoHoras

if (now.getHours() > 20) {
  horaDePosteo.setDate(horaDePosteo.getDate() + 1)
  horaDePosteo.setHours(now.getHours() + horasRestantes - 24, 0, 0, 0)
} else {
  horaDePosteo.setHours(now.getHours() + horasRestantes, 0, 0, 0)
}

const dateDiff = horaDePosteo - now
const tiempoEntrePosteo = 3 * 60 * 60 * 1000
setTimeout(() => {
  postTweet()
  setInterval(postTweet, tiempoEntrePosteo)
}, dateDiff)

//pm2 trigger command: pm2 trigger pm2-bot-process postNow 
//pm2-bot-process refiriendose al nombre del proceso, puede ser cambiado por el índice del mismo
pmx.action('postNow', async (reply) => {
  console.log('Ejecutando postTweet manualmente...')
  await postTweet()
  reply({ success: true })
})

// postTweet("soy un tweet", "./images/takina.jfif")