import { TwitterApi } from 'twitter-api-v2'
import ffmpegStatic from 'ffmpeg-static'
import ffmpeg from 'fluent-ffmpeg'
import ffprobe from '@ffprobe-installer/ffprobe'
import { fileURLToPath } from 'url'
import path from "path"

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
      const filename = `frame-${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} - ${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}.png`
      ffmpeg(videoPath)
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
  const randomCapNum = Math.floor(Math.random() * cantCaps)
  const capPath = `E:/LycoRecoResources/videos/chapter${randomCapNum}.mkv`
  return [randomCapNum, capPath]
}
function secondsToTimeFormat(totalSeconds){
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${minutes}:${seconds}`
}
async function postTodosLosDias(){
try {
  const selectedChapter = getRandomChapter()
  const chapterNum = selectedChapter[0]
  const videoPath = selectedChapter[1]

  const selectedFrame = await getRandomFrame(videoPath, outputPath)
  const frameTime = secondsToTimeFormat(selectedFrame[0])
  // const frameTime = selectedFrame[0]
  const framePath = selectedFrame[1]
  const textPost = `Capítulo ${chapterNum}, minuto ${frameTime}` 
  console.log(textPost)
  postTweet(textPost, framePath)
} catch (error) {
  console.error(error)
}
}

//set timeout (las 00 - now){  setInterval(postTodosLosDias, (24 * 60 * 60 * 1000))  }
const now = new Date()
const horaDePosteo = new Date()
//postea a las 19hs
horaDePosteo.setHours(19, 0, 0, 0)
const dateDiff = horaDePosteo - now

setTimeout(() => {
  setInterval(postTodosLosDias, (24 * 60 * 60 * 1000))
}, dateDiff)

// setInterval(postTodosLosDias, (10 * 1000))

