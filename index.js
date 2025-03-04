import { TwitterApi } from 'twitter-api-v2'
import ffmpegStatic from 'ffmpeg-static'
import ffmpeg from 'fluent-ffmpeg'
import ffprobe from '@ffprobe-installer/ffprobe'
import { fileURLToPath } from 'url'
import path from "path"
import dotenv from 'dotenv'
//estas 4 cosas de abajo son para el pm2 trigger
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { exec } = require("child_process");
const pmx = require('@pm2/io');
dotenv.config();
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
        .on('error', reject);
    })
  })
}

async function postTweet(text, mediaPath) {
  try {
    const mediaId = await client.v1.uploadMedia(mediaPath)
    const tweet = await client.v2.tweet({
        text: text,
        media: { media_ids: [mediaId] }
      })  
    console.log("Tweet publicado:", tweet)
  } catch (error) {
    console.error("Error al publicar el tweet:", error)
  }
}

// postTweet("soy un tweet", "./images/takina.jfif")

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
async function postTodosLosDias(){
  try {
    const selectedChapter = getRandomChapter()
    const chapterNum = selectedChapter[0]
    const videoPath = selectedChapter[1]

    const selectedFrame = await getRandomFrame(videoPath, outputPath)
    const frameTime = secondsToTimeFormat(selectedFrame[0])
    const framePath = selectedFrame[1]
    const textPost = `Capítulo ${chapterNum}, minuto ${frameTime}` 
    console.log(textPost)
    postTweet(textPost, framePath)
  } catch (error) {
    console.error(error)
  }
}

const now = new Date()
const horaDePosteo = new Date()

//postea a las 19hs:
// horaDePosteo.setHours(19, 0, 0, 0)
// que si se pasa de la hora, sea al dia siguiente (sirve para intervalos de 24hs o muchas horas)
// if (horaDePosteo <= now) {
//   horaDePosteo.setDate(horaDePosteo.getDate() + 1)
// }

//postear cada 30mins
horaDePosteo.setHours(0, 0, 0, 0)
if (now.getMinutes() < 30) {
  horaDePosteo.setHours(now.getHours(), 30, 0, 0)
} else {
  if (now.getHours() === 23) {
    horaDePosteo.setDate(horaDePosteo.getDate() + 1)
    horaDePosteo.setHours(0, 0, 0, 0)
  } else {
    horaDePosteo.setHours(now.getHours() + 1, 0, 0, 0)
  }
}

const dateDiff = horaDePosteo - now
const tiempoEntrePosteo = 30 * 60 * 1000
setTimeout(() => {
  postTodosLosDias()
  setInterval(postTodosLosDias, tiempoEntrePosteo)
}, dateDiff)

//cada 24hs postee cada 10 mins:
// setTimeout(() => {
//   postearVarios()
//   setInterval(postearVarios, (24 * 60 * 60 * 1000))
// }, dateDiff)
// function postearVarios(){
//   const tiempoDePosteo = 2 * 60 * 60 * 1000 //2h
//   const tiempoEntrePosteo = 10 * 60 * 1000 //10m
//   postTodosLosDias()
//   const postInterval = setInterval(postTodosLosDias, tiempoEntrePosteo)
//   setTimeout(() => clearInterval(postInterval), tiempoDePosteo)
// }

//pm2 trigger command: pm2 trigger pm2-bot-process postNow 
//pm2-bot-process refiriendose al nombre del proceso, puede ser cambiado por el índice del mismo
pmx.action('postNow', async (reply) => {
  console.log('Ejecutando postTodosLosDias manualmente...');
  await postTodosLosDias();
  reply({ success: true });
});

//pm2 trigger pm2-bot-process postVarios 
// pmx.action('postVarios', async (reply) => {
//   console.log('Ejecutando postTodosLosDias manualmente...');
//   postearVarios();
//   reply({ success: true });
// });