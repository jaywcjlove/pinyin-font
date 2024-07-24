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
  const fileNmae = path.basename(svgPath, ".svg");
  let unicodeName = fileNmae;
  if (unicodeName.endsWith('_')) {
    unicodeName = unicodeName.replace(/_$/g, '');
  }
  const glyph = fs.createReadStream(svgPath)
  console.log(`\n  ┌┈▶ ${fileNmae} ${charToSvgFontUnicode(unicodeName)}`);
  glyph.metadata = { unicode: [unicodeName] , name: fileNmae };
  fontStream.write(glyph);
}

function svgToSVGFont(fontName = "pinyin",src = "svg", dist = "./docs/pinyin.svg") {
  return new Promise((resolve, reject) => {
    const fontStream = new SVGIcons2SVGFont({
      log: (message) => console.log(message),
      fontName: fontName,
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

function svgFontToTTF(src = "./docs/pinyin.svg", dist = "./docs/pinyin.ttf") {
  const svgFont = fs.readFileSync(src, "utf8");
  const ttf = svg2ttf(svgFont, {});
  const ttfBuf = Buffer.from(ttf.buffer);
  fs.writeFileSync(dist, ttfBuf);
  console.log(`SUCCESS TTF font successfully created!\n  ╰┈▶ ${dist}`);
}

;(async () => {
  // pinyinstep(拼音笔顺体)
  await svgToSVGFont("pinyinstep","./svg/step", "./docs/pinyin-step.svg");
  svgFontToTTF("./docs/pinyin-step.svg", "./docs/pinyin-step.ttf");

  // pingyin-regular(拼音常规体)
  await svgToSVGFont("pinyin","./svg/regular", "./docs/pinyin-regular.svg");
  svgFontToTTF("./docs/pinyin-regular.svg", "./docs/pinyin-regular.ttf");

  // Update version in docs/index.html
  const pkg = fs.readJsonSync('./package.json');
  const fileContent = fs.readFileSync('./docs/index.html', 'utf-8');
  let updatedContent = fileContent.replace(/<sup>.*<\/sup>/g, `<sup>v${pkg.version}</sup>`);
  updatedContent = fileContent.replace(/url\('.\/pinyin-step.*\.ttf'\)/g, `url('./pinyin-step.ttf?v=${pkg.version}')`);
  fs.writeFileSync('./docs/index.html', updatedContent);
})()