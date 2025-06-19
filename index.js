const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const groupLinks = fs.readFileSync('groups.txt', 'utf8').split('\n').filter(Boolean);
const imageFolder = path.resolve(__dirname, 'images');

// Load cookie từ file
const cookieString = fs.readFileSync('cookies.txt', 'utf8');
const cookies = cookieString.split(';').map((cookie) => {
  const [name, ...rest] = cookie.trim().split('=');
  return {
    name,
    value: rest.join('='),
    domain: '.facebook.com',
  };
});

const postToGroup = async (page, groupURL, content, imagePaths = []) => {
  try {
    console.log(`🔗 Đang vào nhóm: ${groupURL}`);
    await page.goto(groupURL, { waitUntil: 'networkidle2' });

    // Mở khung viết bài
    await page.waitForSelector('span[class="x1lliihq x6ikm8r x10wlt62 x1n2onr6"]', { timeout: 15000 });
    await page.click('span[class="x1lliihq x6ikm8r x10wlt62 x1n2onr6"]');

    // Nhập nội dung
    await page.waitForSelector('div[role="dialog"] div[role="textbox"]', { timeout: 15000 });
    const textbox = await page.$('div[role="dialog"] div[role="textbox"]');
    await textbox.type(content);

    // Nếu có ảnh thì tải lên
    if (imagePaths.length > 0) {
      const photoButtonSelector = 'div[aria-label="Photo/video"]';
      await page.waitForSelector(photoButtonSelector, { timeout: 10000 });
      await page.click(photoButtonSelector);

      const inputFileSelector = 'input[type="file"][multiple]';
      await page.waitForSelector(inputFileSelector, { timeout: 10000 });
      const input = await page.$(inputFileSelector);

      await input.uploadFile(...imagePaths);
      console.log(`📸 Đã tải ${imagePaths.length} ảnh`);
      await delay(8000); // Chờ ảnh hiển thị
    }

    // Đăng bài
    await page.waitForSelector('div[aria-label="Post"]', { timeout: 10000 });
    await page.click('div[aria-label="Post"]');
    console.log(`✅ Đã đăng bài vào nhóm: ${groupURL}`);
  } catch (err) {
    console.error(`❌ Lỗi với nhóm ${groupURL}: ${err.message}`);
  }
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setCookie(...cookies);

  const content = `Hello everyone 👋\nThis is an automated post using Puppeteer.\n🔥 #Automation #FacebookBot`;

  const imageFiles = fs.readdirSync(imageFolder)
    .filter(file => /\.(jpe?g|png)$/i.test(file))
    .map(file => path.join(imageFolder, file));

  const loopPost = async () => {
    for (const groupURL of groupLinks) {
      const selectedImages = imageFiles.slice(0, 3); // Chọn tối đa 3 ảnh
      await postToGroup(page, groupURL, content, selectedImages);
      console.log('⏳ Chờ 5 phút trước nhóm tiếp theo...\n');
      await delay(5 * 60 * 1000); // 5 phút
    }
  };

  while (true) {
    await loopPost();
    console.log('⏲️ Hoàn tất một vòng đăng bài. Chờ 2 tiếng trước khi lặp lại...\n');
    await delay(2 * 60 * 60 * 1000); // 2 tiếng
  }

  // await browser.close(); // Không đóng nếu chạy liên tục
})();
