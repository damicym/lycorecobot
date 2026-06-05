import { TwitterApi } from 'twitter-api-v2'
import ffmpegStatic from 'ffmpeg-static'
import path from "path"
import dotenv from 'dotenv'
import fs from 'fs';
import { execFile } from 'child_process'
import { promisify } from 'util'
import pmxIO from '@pm2/io'

const execFilePromise = promisify(execFile)

// Inicializar PM2 IO correctamente
const pmx = pmxIO.init({
  network: true,
  ports: true
})

dotenv.config()

const carpetaResources = 'C:/Mis cosas/dependencias/LycoRecoResources'
const carpetaVideos = `${carpetaResources}/videos`
const carpetaFramesOutput = `${carpetaResources}/frames`
const extensionesValidas = ['.mkv', '.mp4']

const client = new TwitterApi({
  appKey: process.env.API_KEY,
  appSecret: process.env.API_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_SECRET,
})

const archivos = fs.readdirSync(carpetaVideos)
const videos = archivos.filter(file => extensionesValidas.includes(path.extname(file).toLowerCase()))
const cantVideos = videos.length

// Función para ejecutar ffprobe sin mostrar ventana
async function getVideoDuration(videoPath) {
  const args = [
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_format',
    videoPath
  ]
  
  const { stdout } = await execFilePromise('ffprobe', args, {
    windowsHide: true,
    encoding: 'utf8'
  })
  
  const metadata = JSON.parse(stdout)
  return parseFloat(metadata.format.duration)
}

// Función para extraer frame sin mostrar ventana
async function extractFrame(videoPath, timestamp, outputPath) {
  const args = [
    '-ss', timestamp.toString(),
    '-i', videoPath,
    '-vframes', '1',
    '-q:v', '5',
    '-s', '1920x1080',
    '-loglevel', 'quiet',
    outputPath
  ]
  
  await execFilePromise(ffmpegStatic, args, {
    windowsHide: true
  })
  
  return outputPath
}

function getRandomFrame(videoPath, outputPath) {
  return new Promise(async (resolve, reject) => {
    try {
      const duration = await getVideoDuration(videoPath)
      const randomTime = Math.random() * duration
      const now = new Date()
      const filename = `frame-${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} - ${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}.jpg`
      const fullPath = path.join(outputPath, filename)
      
      await extractFrame(videoPath, randomTime, fullPath)
      resolve([randomTime, fullPath])
    } catch (err) {
      reject(err)
    }
  })
}

async function postTweet() {
  const horario = new Date()
  console.log(`postTweet se ejecutó, horario: [${horario}] (puede que no haya funcionado)`)
  try {
    const selectedChapter = getRandomChapter()
    const chapterNum = selectedChapter[0]
    const videoPath = selectedChapter[1]
    const selectedFrame = await getRandomFrame(videoPath, carpetaFramesOutput)
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
  const randomCapNum = Math.floor(Math.random() * cantVideos) + 1
  const capPath = `${carpetaVideos}/chapter${randomCapNum}.mkv`
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
let now = new Date()

const horasEntrePosteo = 2
let postInterval = setInterval(async () => {
  now = new Date()
  if (now.getHours() % horasEntrePosteo === 0 && now.getMinutes() === 0) {
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