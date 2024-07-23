import SVGIcons2SVGFont from 'svgicons2svgfont';

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

function svgToSVGFont(src) {
  return new Promise((resolve, reject) => {
    // init
    const fontStream = new SVGIcons2SVGFont({
      log: (message) => log.log(message),
    });

  });
}

;(async () => {
  await svgToSVGFont("./svg");
})()