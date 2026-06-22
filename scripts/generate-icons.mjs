import sharp from 'sharp'
import { writeFileSync } from 'fs'
import path from 'path'

// SVG do ícone Nestly (N em fundo teal)
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#14b8a6"/>
  <text
    x="256" y="370"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="320"
    fill="white"
    text-anchor="middle"
    dominant-baseline="auto"
  >N</text>
</svg>
`

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for (const size of sizes) {
  const outputPath = path.join('public', 'icons', `icon-${size}x${size}.png`)
  await sharp(Buffer.from(svgIcon))
    .resize(size, size)
    .png()
    .toFile(outputPath)
  console.log(`✅ Generated ${outputPath}`)
}

// Apple touch icon (180x180)
await sharp(Buffer.from(svgIcon))
  .resize(180, 180)
  .png()
  .toFile('public/icons/apple-touch-icon.png')
console.log('✅ Generated public/icons/apple-touch-icon.png')

// favicon 32x32
await sharp(Buffer.from(svgIcon))
  .resize(32, 32)
  .png()
  .toFile('public/favicon-32x32.png')
console.log('✅ Generated public/favicon-32x32.png')

// favicon 16x16
await sharp(Buffer.from(svgIcon))
  .resize(16, 16)
  .png()
  .toFile('public/favicon-16x16.png')
console.log('✅ Generated public/favicon-16x16.png')
