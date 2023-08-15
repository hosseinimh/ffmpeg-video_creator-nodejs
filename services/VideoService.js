var fs = require("fs");
var https = require("https");
var shell = require("shelljs");
var sharp = require("sharp");
var path = require("path");

class VideoService {
  async create(yadboodId, yadboodTitle, imagePath) {
    try {
      await this.init(yadboodId, yadboodTitle, imagePath);
      this.render();
      this.onRendered();
    } catch (e) {
      console.log("error: " + e);
    }
  }

  async init(yadboodId, yadboodTitle, imagePath) {
    this.yadboodId = yadboodId;
    this.yadboodTitle = yadboodTitle;
    this.imagePath = imagePath;
    this.resourcesPath = "./yadbood_resources";
    this.sourceVideoPath = `${this.resourcesPath}/source.mp4`;
    this.yekanFontPath = `${this.resourcesPath}/BYekan.ttf`;
    this.tahomaFontPath = `${this.resourcesPath}/tahoma.ttf`;
    this.videoDirPath = `./videos/${this.yadboodId}`;
    this.videoImagePath = `${this.videoDirPath}/image.jpg`;
    this.videoCropImagePath = `${this.videoDirPath}/crop-image.png`;
    this.videoQrCodePath = `${this.videoDirPath}/qr-code.jpg`;
    this.videoPath = `${this.videoDirPath}/video.mp4`;
    this.tempVideoPath = `${this.videoDirPath}/temp-video.mp4`;
    this.videoTitle = "آدرس صفحه یادبود مجازی";
    this.makeDestDir();
    await this.getImage();
    await this.getQrCode();
    await this.cropCircle();
  }

  makeDestDir() {
    if (!fs.existsSync(this.videoDirPath)) {
      fs.mkdirSync(this.videoDirPath);
    }
    return new Promise((resolve, reject) => {
      fs.readdir(this.videoDirPath, (e, files) => {
        if (e) {
          return reject(e);
        }
        for (const file of files) {
          fs.unlink(path.join(this.videoDirPath, "/", file), (e) =>
            e ? reject(e) : resolve("ok")
          );
        }
      });
    });
  }

  async getImage() {
    return await this.pDownload(this.imagePath, this.videoImagePath);
  }

  async getQrCode() {
    const qrCodePath = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&choe=UTF-8&chl=Https://iPorse.ir/qr/
        ${this.yadboodId}`;
    return await this.pDownload(qrCodePath, this.videoQrCodePath);
  }

  cropCircle() {
    const width = 400,
      r = width / 2,
      circleShape = Buffer.from(
        `<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`
      );
    return new Promise((resolve, reject) => {
      sharp(this.videoImagePath)
        .resize(width, width)
        .composite([
          {
            input: circleShape,
            blend: "dest-in",
          },
        ])
        .png()
        .toFile(this.videoCropImagePath, (e) =>
          e ? reject(e) : resolve("ok")
        );
    });
  }

  render() {
    let command;
    command = `ffmpeg -y -i ${this.sourceVideoPath} -vf "drawtext=fontfile=${this.yekanFontPath}:text='${this.yadboodTitle}':fontcolor=white:fontsize=18:box=0:x=(w-text_w)/2:y=16" -codec:a copy ${this.tempVideoPath}`;
    this.shellExec(command);
    command = `ffmpeg -y -i ${this.tempVideoPath} -vf "drawtext=fontfile=${this.yekanFontPath}:text='${this.videoTitle}':fontcolor=white:fontsize=14:box=0:x=20:y=h-50" -codec:a copy ${this.videoPath}`;
    this.shellExec(command);
    command = `ffmpeg -y -i ${this.videoPath} -vf "drawtext=fontfile=${this.tahomaFontPath}:text='www.iPorse.ir/':fontcolor=white:fontsize=14:box=0:x=20:y=h-30" -codec:a copy ${this.tempVideoPath}`;
    this.shellExec(command);
    command = `ffmpeg -y -i ${this.tempVideoPath} -vf "drawtext=fontfile=${this.tahomaFontPath}:text='${this.yadboodId}':fontcolor=yellow:fontsize=16:box=0:x=110:y=h-30" -codec:a copy ${this.videoPath}`;
    this.shellExec(command);
    command = `ffmpeg -y -i ${this.videoPath} -i ${this.videoQrCodePath} -filter_complex "[1][0]scale2ref=oh*mdar:ih*0.15[logo][video];[video][logo]overlay=(main_w-overlay_w-20):(main_h-overlay_h-20);" ${this.tempVideoPath}`;
    this.shellExec(command);
    command = `ffmpeg -y -i ${this.tempVideoPath} -i ${this.videoCropImagePath} -filter_complex "[1][0]scale2ref=oh*mdar:ih*0.5[logo][video];[video][logo]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2;[1:v]format=rgba,geq=r=\'r(X,Y)\':a=\'1*alpha(X,Y)\',scale=205:205,zoompan=d=25*4:d=125:s=205x205,fade=in:st=2:d=2:alpha=1,fade=out:st=5:d=2:alpha=1[im];[0][im]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:enable='between(t,0,48)'" ${this.videoPath}`;
    this.shellExec(command);
  }

  shellExec(command) {
    shell.exec(command);
  }

  pDownload(url, dest) {
    var file = fs.createWriteStream(dest);
    return new Promise((resolve, reject) => {
      var responseSent = false;
      https
        .get(url, (response) => {
          response.pipe(file);
          file.on("finish", () => {
            file.close(() => {
              if (responseSent) return;
              responseSent = true;
              resolve("ok");
            });
          });
        })
        .on("error", (e) => {
          if (responseSent) return;
          responseSent = true;
          reject(e);
        });
    });
  }

  onRendered() {
    try {
      fs.unlinkSync(path.resolve(this.videoImagePath));
      fs.unlinkSync(path.resolve(this.videoCropImagePath));
      fs.unlinkSync(path.resolve(this.videoQrCodePath));
      fs.unlinkSync(path.resolve(this.tempVideoPath));
    } catch {}
  }
}

const videoService = new VideoService();

module.exports = videoService;
