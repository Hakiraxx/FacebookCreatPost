const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const groupLinks = fs.readFileSync('groups.txt', 'utf8')
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean);

const imageFolder = path.resolve(__dirname, 'images');

// Đọc cookies từ file
const cookieString = fs.readFileSync('cookies.txt', 'utf8');
const cookies = cookieString.split(';').map((cookie) => {
  const [name, ...rest] = cookie.trim().split('=');
  return {
    name,
    value: rest.join('='),
    domain: '.facebook.com',
  };
});

// Hàm đăng bài vào nhóm
const postToGroup = async (page, groupURL, content, imagePaths = []) => {
  try {
    console.log(`🔗 Vào nhóm: ${groupURL}`);
    await page.goto(groupURL, { waitUntil: 'networkidle2' });

    // Mở khung đăng bài
    await page.waitForSelector('div[class="xi81zsa x1lkfr7t xkjl1po x1mzt3pk xh8yej3 x13faqbe"]', { timeout: 15000 });
    const postBox = await page.$('div[class="xi81zsa x1lkfr7t xkjl1po x1mzt3pk xh8yej3 x13faqbe"]');
    await page.evaluate(el => el.click(), postBox);

    // Nhập nội dung bài viết
    await page.waitForSelector('div[role="dialog"] div[role="textbox"]', { timeout: 15000 });
    const textbox = await page.$('div[role="dialog"] div[role="textbox"]');
    await textbox.type(content);

    // Nếu có ảnh, upload trực tiếp không click nút "Photo/video"
    if (imagePaths.length > 0) {
      const inputFileSelector = 'input[type="file"][multiple]';
      await page.waitForSelector(inputFileSelector, { timeout: 10000 });
      const input = await page.$(inputFileSelector);
      await input.uploadFile(...imagePaths);
      console.log(`📸 Đã tải lên ${imagePaths.length} ảnh`);
      await delay(10000); // chờ ảnh tải xong
    }

    // Đăng bài
    await page.waitForSelector('div[aria-label="Đăng"], div[aria-label="Post"]', { timeout: 10000 });
    const postBtn = await page.$('div[aria-label="Đăng"], div[aria-label="Post"]');
    await page.evaluate(el => el.scrollIntoView(), postBtn);
    await page.evaluate(el => el.click(), postBtn);

    console.log(`✅ Đã đăng bài vào nhóm: ${groupURL}`);
  } catch (err) {
    console.error(`❌ Lỗi nhóm ${groupURL}: ${err.message}`);
  }
};

(async () => {
  const browser = await puppeteer.launch({
    //executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', //VPS thi dung
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setCookie(...cookies);

  const contentL = [
    "🛎️ QUÁN EM CÓ GÌ? GỌI TÊN NGAY MÓN NGON QUÊN LỐI VỀ! 👇\n🥵 MỲ CAY – Cấp mấy cũng có! Topping ú ụ, nước lèo đậm đà, cay tới đâu… phê tới đó!\n🧋 TRÀ SỮA – thơm chuẩn vị, ngọt vừa gu!\n❄️ ĐÁ XAY – Mát lạnh tỉnh cả ngày: cookie, caramel, matcha… uống một ngụm là ghiền!\n🍓 SINH TỐ – Trái cây tươi 100%, không pha bột, không đường hóa học!\n🍵 MATCHA LATTE – Thơm mùi matcha nguyên chất, béo nhẹ sữa tươi, chill như đang ở Kyoto 🍃\n\n⸻\n\n🎉 Đói bụng có mỳ cay\n🎈 Khát nước có trà sữa - đá xay - matcha\n🍹 Muốn đẹp da giữ dáng? Có ngay sinh tố trái cây tươi\n\n📍 Roy Tea Vinhomes Grand Park  – Ngon thật, giá xinh, phục vụ nhiệt tình!🛵 Ship tận cửa – chỉ cần bạn order!\n📞 Inbox liền tay / Gọi ngay: 0966665477 Zalo",
    "🥵 MỲ CAY – Cay cấp độ từ 0 đến… cháy miệng! Ai thất tình ghé ăn cấp 7 cho quên người yêu!\n🧋 TRÀ SỮA – Trà đậm, sữa thơm, trân châu dai dẻo – uống một lần là không bỏ được!\n❄️ ĐÁ XAY – Lạnh run người, ngọt ngào tỉnh cả thanh xuân! Cookie, caramel, matcha... có đủ!\n🍓 SINH TỐ – Trái cây tươi rói, xay tại chỗ, không chất bảo quản, uống vào là mát cả tâm hồn!\n🍵 MATCHA LATTE – Nhẹ nhàng, tinh tế, thơm mùi Nhật Bản – dành cho người thích chill\n⸻\n📍 Roy Tea Vinhomes Grand Park  – Ngon thật, giá xinh, phục vụ nhiệt tình!\n🛵 Ship tận cửa – chỉ cần bạn order!\n📞 Inbox liền tay / Gọi ngay: 0966665477 Zalo",
    "🥢 “ĐÓI LÀ PHẢI ĂN – BUỒN LÀ PHẢI UỐNG!”\nCần đồ ăn ngon? Quẹo lựa – quán em có đủ combo chữa lành! 💖\n🔥 MỲ CAY – Mặn mà như người yêu cũ, cay xé như lời chia tay. Cấp mấy cũng có – chỉ cần bạn dám thử!\n🧋 TRÀ SỮA – Đường bao nhiêu tuỳ chỉnh, trân châu đầy ly, béo thơm đúng chuẩn “gu người sành uống”!\n🧊 ĐÁ XAY – Matcha, caramel, cookie… xay mịn, uống vào thấy “cuộc đời chill lại”!\n🍓 SINH TỐ – Trái cây thật 100%, không chất bảo quản – mát từ cổ họng tới tâm trạng!\n🍵 MATCHA LATTE – Vị thanh nhẹ, ngọt dịu, sang chảnh kiểu Nhật – yêu từ ngụm đầu tiên 🍃\n\n⸻\n📍 Roy Tea Vinhomes Grand Park  – Ngon thật, giá xinh, phục vụ nhiệt tình!\n🛵 Ship tận cửa – chỉ cần bạn order!\n📞 Inbox liền tay / Gọi ngay: 0966665477 Zalo",
    "✨ “MỖI MÓN ĂN – MỘT CHÚT YÊU THƯƠNG” 💗\nTụi mình không bán món ăn, tụi mình bán niềm vui kèm topping!\n🥢 MỲ CAY – Không phải để bạn khóc, mà để bạn thấy mình vẫn còn cảm xúc. Cay đấy… mà ngon lắm!\n🧋 TRÀ SỮA – Lắc nhẹ vài cái, trân châu nổi lên như cảm xúc lâu ngày được quan tâm 🥺\n🍫 ĐÁ XAY – Mát lạnh từ cổ xuống tim, hớp một ngụm là thấy mùa hè dễ chịu hẳn\n🍓 SINH TỐ – Trái cây xay nhuyễn, mịn màng như crush ôm bạn từ phía sau 😚\n🍵 MATCHA LATTE – Dành cho những ngày bạn muốn chậm lại, nhâm nhi vị xanh mát, bỏ quên bộn bề…\n⸻\n📍 Roy Tea Vinhomes Grand Park  – Ngon thật, giá xinh, phục vụ nhiệt tình!\n🛵 Ship tận cửa – chỉ cần bạn order!\n📞 Inbox liền tay / Gọi ngay: 0966665477 Zalo"
  ];

  const imageFiles = fs.existsSync(imageFolder)
    ? fs.readdirSync(imageFolder)
        .filter(file => /\.(jpe?g|png)$/i.test(file))
        .map(file => path.join(imageFolder, file))
    : [];

  while (true) {
    for (const groupURL of groupLinks) {
      const selectedImages = imageFiles.slice(0, 3);
      const contentIndex = Math.floor(Math.random() * contentL.length);
      const content = contentL[contentIndex];
      await postToGroup(page, groupURL, content, selectedImages);
      console.log('⏳ Chờ 2 phút trước khi qua nhóm tiếp theo...\n');
      await delay(2 * 60 * 1000);
    }

    console.log('🕐 Hoàn tất 1 vòng đăng. Chờ 6 tiếng trước khi đăng lại...\n');
    await delay(6 * 60 * 60 * 1000);
  }

  // await browser.close();
})();
