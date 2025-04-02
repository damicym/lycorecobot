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
  const horario = new Date()
  console.log(`postTweet se ejecutó, horario: [${horario}] (puede que no haya funcionado)`)
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
    hayRequests = true
  } catch (error) {
    if (error.response?.status === 429) {
      hayRequests = false
      console.error("No hay requests: ", error)
    } else {
      console.error("Error al publicar el tweet (no es 429):", error)
      hayRequests = true
    }
  }
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

let hayRequests = true
const horasEntrePosteo = 2
let now = new Date()
setInterval(async () => {
  now = new Date()
  if (now.getHours() % horasEntrePosteo === 0 && now.getMinutes === 0) {
    if (hayRequests) {
      await postTweet()
    } else {
      await wait(12 * 60 * 60 * 1000)
      hayRequests = true
    }
  }
}, 60 * 1000) //cada minuto se fija si postea

function wait(waitTime) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, waitTime)
  })
}

//pm2 trigger command: pm2 trigger pm2-bot-process postNow 
//pm2-bot-process refiriendose al nombre del proceso, puede ser cambiado por el índice del mismo
pmx.action('postNow', async (reply) => {
  console.log('Ejecutando postTweet manualmente...')
  await postTweet()
  reply({ success: true })
})

// postTweet("soy un tweet", "./images/takina.jfif")