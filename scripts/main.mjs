import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';
import { SVGIcons2SVGFontStream } from 'svgicons2svgfont';
import svg2ttf from 'svg2ttf';
import ttf2woff2 from 'ttf2woff2';

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

/// 符号
const symbol = {
  space: ' ',                        // 普通空格
  nonBreakingSpace: '\u00A0',        // 不间断空格
  enSpace: '\u2002',                 // 半个空格
  emSpace: '\u2003',                 // 全个空格
  quarterEmSpace: '\u2005',          // 四分之一空格
  thinSpace: '\u2009',               // 细空格
  zeroWidthSpace: '\u200B',          // 零宽度空格
  ideographicSpace: '\u3000',        // 全角空格
  narrowNoBreakSpace: '\u202F',      // 窄不间断空格（可选）
  mediumMathematicalSpace: '\u205F', // 中等数学空格（可选）
  zeroWidthNonJoiner: '\u200C',      // 零宽度非连接符（可选）
  zeroWidthJoiner: '\u200D',         // 零宽度连接符（可选）

  period: ".",                       // 句号
  comma: ",",                        // 逗号
  question: "?",                     // 问号
  exclamation: "!",                  // 感叹号
  colon: ":",                        // 冒号
  semicolon: ";",                    // 分号
  apostrophe: "'",                   // 单引号
  quotation: '"',                    // 双引号
  leftBrace: "{",                    // 左大括号
  rightBrace: "}",                   // 右大括号
  leftParenthesis: "(",              // 左小括号
  rightParenthesis: ")",             // 右小括号
  leftBracket: "[",                  // 左中括号
  rightBracket: "]",                 // 右中括号
  hyphen: "-",                       // 连字符
  underscore: "_",                   // 下划线
  ampersand: "&",                    // 与
  atSign: "@",                       // @
};

function writeFontStream(svgPath, fontStream) {
  const fileNmae = path.basename(svgPath, ".svg");
  let unicodeName = fileNmae;
  if (unicodeName.endsWith('_')) {
    unicodeName = unicodeName.replace(/_$/g, '');
  }
  if (symbol[unicodeName]) {
    unicodeName = symbol[unicodeName];
  }
  const glyph = fs.createReadStream(svgPath);
  //console.log(`\n  ┌┈▶ ${fileNmae} ${unicode}`);
  glyph.metadata = { unicode: [unicodeName.normalize('NFC')] , name: fileNmae.replace(/_$/g, '') };
  fontStream.write(glyph);
}

function svgToSVGFont(fontName = "pinyin",src = "svg", dist = "./docs/pinyin.svg") {
  return new Promise((resolve, reject) => {
    const fontStream = new SVGIcons2SVGFontStream({
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
// Update version in docs/index.html
const pkg = fs.readJsonSync('./package.json');
function svgFontToTTF(src = "./docs/pinyin.svg", dist = "./docs/pinyin.ttf") {
  const svgFont = fs.readFileSync(src, "utf8");
  const version = semver.parse(pkg.version);
  const ttf = svg2ttf(svgFont, {
    description: "Pinyin font specifically designed for the app 'Baby Copybook'.",
    copyright: "Copyright (c) 2024, Wang Chujiang <https://wangchujiang.com>",
    url: "https://github.com/jaywcjlove/pinyin-font",
    version: `Version ${version.major}.${version.minor}`,
  });
  const ttfBuf = Buffer.from(ttf.buffer);
  fs.writeFileSync(dist, ttfBuf);
  console.log(`SUCCESS TTF font successfully created!\n  ╰┈▶ ${dist}`);
}

function ttfTowoff2(src = "./docs/pinyin.ttf", dist = "./docs/pinyin.woff2") {
  const ttf = fs.readFileSync(src);
  const woff2 = Buffer.from(ttf2woff2(ttf).buffer);
  fs.writeFileSync(dist, woff2);
  console.log(`SUCCESS WOFF2 font successfully created!\n  ╰┈▶ ${dist}`);
}

;(async () => {
  // pinyinstep(拼音笔顺体)
  await svgToSVGFont("pinyinstep","./svg/step", "./docs/pinyin-step.svg");
  svgFontToTTF("./docs/pinyin-step.svg", "./docs/pinyin-step.ttf");
  ttfTowoff2("./docs/pinyin-step.ttf", "./docs/pinyin-step.woff2");
  
  // pingyin-regular(拼音常规体)
  await svgToSVGFont("pinyin","./svg/regular", "./docs/pinyin-regular.svg");
  svgFontToTTF("./docs/pinyin-regular.svg", "./docs/pinyin-regular.ttf");
  ttfTowoff2("./docs/pinyin-regular.ttf", "./docs/pinyin-regular.woff2");

  const fileContent = fs.readFileSync('./docs/index.html', 'utf-8');
  const updatedContent = fileContent.replace(/<sup>.*<\/sup>/g, `<sup>v${pkg.version}</sup>`)
          .replace(/url\('.\/pinyin-step\.ttf.*'\)\s/g, `url('./pinyin-step.ttf?v=${pkg.version}') `)
          .replace(/url\('.\/pinyin-regular\.ttf.*'\)\s/g, `url('./pinyin-regular.ttf?v=${pkg.version}') `);
  fs.writeFileSync('./docs/index.html', updatedContent);
})()