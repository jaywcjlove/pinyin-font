import fs from 'fs-extra';
import path from 'path';
import SVGIcons2SVGFont from 'svgicons2svgfont';
import svg2ttf from 'svg2ttf';

/*
 * Filter svg files
 * @return {Array} svg files
 */
export function filterSvgFiles(svgFolderPath) {
  let files = fs.readdirSync(svgFolderPath, 'utf-8');
  let svgArr = [];
  if (!files) {
    throw new Error(`Error! Svg folder is empty.${svgFolderPath}`);
  }

  for (let i in files) {
    if (typeof files[i] !== 'string' || path.extname(files[i]) !== '.svg') continue;
    if (!~svgArr.indexOf(files[i])) {
      svgArr.push(path.join(svgFolderPath, files[i]));
    }
  }
  return svgArr;
}

function charToSvgFontUnicode(char) {
  // 获取字符的 Unicode 码点
  let unicode = char.codePointAt(0);
  // 转换为十六进制格式，并大写表示
  let unicodeHex = unicode.toString(16).toUpperCase();
  // 格式化为 SVG 字体使用的 Unicode 表示
  let svgFontUnicode = `&#x${unicodeHex};`;
  return svgFontUnicode;
}

function writeFontStream(svgPath, fontStream) {
  // file name
  let fileNmae = path.basename(svgPath, ".svg");
  const glyph = fs.createReadStream(svgPath)
  //const curUnicode = String.fromCharCode(fileNmae);
  const curUnicode = charToSvgFontUnicode(fileNmae);
  const unicode = [curUnicode];
  console.log(`\n  ┌┈▶ ${fileNmae} ${unicode}`);
  glyph.metadata = { unicode: [fileNmae] , name: fileNmae };
  fontStream.write(glyph);
}

function svgToSVGFont(src = "svg", dist = "./fonts/pinyin.svg") {
  return new Promise((resolve, reject) => {
    const fontStream = new SVGIcons2SVGFont({
      log: (message) => console.log(message),
      fontName: "pinyin",
      fontHeight: 1000,
      normalize: true,
    });
    // Setting the font destination
    fontStream.pipe(fs.createWriteStream(dist))
      .on("finish", () => {
        console.log(`SUCCESS SVG font successfully created!\n  ╰┈▶ ${dist}`)
        resolve();
      })
      .on("error", (err) => {
        if (err) {
          reject(err);
        }
      });

    filterSvgFiles(src).forEach((svgPath) => {
      if (typeof svgPath !== 'string') return false;
      writeFontStream(svgPath, fontStream);
    });
    // Do not forget to end the stream
    fontStream.end();
  });
}

function svgFontToTTF(src = "./fonts/pinyin.svg", dist = "./fonts/pinyin.ttf") {
  const svgFont = fs.readFileSync(src, "utf8");
  const ttf = svg2ttf(svgFont, {});
  const ttfBuf = Buffer.from(ttf.buffer);
  fs.writeFileSync(dist, ttfBuf);
  console.log(`SUCCESS TTF font successfully created!\n  ╰┈▶ ${dist}`);
}

;(async () => {
  await svgToSVGFont("./svg", "./fonts/pinyin.svg");
  svgFontToTTF("./fonts/pinyin.svg", "./fonts/pinyin.ttf");
})()