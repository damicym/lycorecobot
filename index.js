import { TwitterApi } from 'twitter-api-v2'
import ffmpegStatic from 'ffmpeg-static'
import ffmpeg from 'fluent-ffmpeg'
import ffprobe from '@ffprobe-installer/ffprobe'
ffmpeg.setFfmpegPath(ffmpegStatic)
ffmpeg.setFfprobePath(ffprobe.path)

import { fileURLToPath } from 'url'
import path from "path"
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const client = new TwitterApi({
  appKey: process.env.API_KEY,
  appSecret: process.env.API_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_SECRET,
})

const videoPath = path.join(__dirname, 'videos/video1.mp4')
const outputPath = path.join(__dirname, 'frames')

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
        .on('end', () => resolve(path.join(outputPath, filename)))
        .on('error', reject);
    })
  })
}

async function postTweet(mediaPath) {
  try {
    const mediaId = await client.v1.uploadMedia(mediaPath)
    const tweet = await client.v2.tweet({
        media: { media_ids: [mediaId] }
      })  
    console.log("Tweet publicado:", tweet)
  } catch (error) {
    console.error("Error al publicar el tweet:", error)
  }
}

// postTweet("soy un tweet", "./images/takina.jfif")

async function postTodosLosDias(){
try {
  const framePath = await getRandomFrame(videoPath, outputPath);
  console.log("Frame guardado en:", framePath)
  postTweet(framePath)
} catch (error) {
  console.error(error)
}
}
// setInterval(postTodosLosDias, (24 * 60 * 60 * 1000))

  
  