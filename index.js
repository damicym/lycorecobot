import { TwitterApi } from 'twitter-api-v2'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'

ffmpeg.setFfmpegPath(ffmpegStatic)
ffmpeg.setFfprobePath(ffmpegStatic)

const client = new TwitterApi({
  appKey: process.env.API_KEY,
  appSecret: process.env.API_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_SECRET,
})

const videoPath = './videos/video1.mp4'
const outputPath = './frames'

function getRandomFrame(videoPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);

      const duration = metadata.format.duration;
      const randomTime = Math.floor(Math.random() * duration);

      ffmpeg(videoPath)
        .screenshots({
          timestamps: [randomTime],
          filename: 'frame.png',
          folder: outputPath,
          size: '640x?',
        })
        .on('end', () => resolve(`${outputPath}/frame.png`))
        .on('error', reject);
    });
  });
}
  
  try {
        const framePath = await getRandomFrame(videoPath, outputPath);
        console.log("Frame guardado en:", framePath)
        postTweet("hola", framePath);
    } catch (error) {
        console.error(error);
    }

  

async function postTweet(text="tweet de prueba", mediaPath) {
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

  
  