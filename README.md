# Chánh Điện Tịnh Tâm

Chánh điện online 2.5D cho TikTok LIVE. Mỗi người xem bình luận là bước vào chánh điện, ngồi xuống bồ đoàn tụng kinh. Ai tặng quà sẽ được xướng tên hồi hướng bằng giọng đọc tiếng Việt. Có nhạc thiền, chuông, mõ và đọc kinh định kỳ.

Mã nguồn của dự án chia sẻ miễn phí (MIT); các thư viện đi kèm giữ giấy phép riêng. Có ba phần:

| Thư mục | Là gì |
|---|---|
| `index.html`, `assets/` | Bản web tĩnh cho mọi người tự vào ngồi tụng (đăng lên Cloudflare Pages) |
| `live/` | Bộ công cụ phát LIVE: server Node, overlay 9:16, bảng điều khiển |
| `desktop/` | Ứng dụng Windows/macOS đóng gói sẵn server và giao diện, biểu tượng hoa sen |

## Tải và cài ứng dụng máy tính

Ứng dụng Desktop cho Windows 64-bit và macOS Intel/Apple silicon được phát
hành tại [GitHub Releases](https://github.com/mashupsolution/di-chua-online/releases/latest).
Mỗi bản phát hành có một trình cài Windows, hai DMG macOS và tệp
`SHA256SUMS` để kiểm tra tải xuống, cùng mã nguồn và công cụ tạo đúng bản đó. Không cần cài Node.js, Bun hoặc thiết lập môi trường. Ứng dụng không tự cập nhật; khi có bản
mới, tải và cài bản phát hành mới theo cách thủ công.

Để kiểm tra tệp tải xuống, tải cả `SHA256SUMS` từ cùng bản phát hành và so
sánh mã SHA-256 của tệp cài đặt với dòng tương ứng trong `SHA256SUMS`. Trên
Windows PowerShell, chạy `Get-FileHash "đường-dẫn-tệp-cài.exe" -Algorithm SHA256`;
trên macOS Terminal, chạy `shasum -a 256 "đường-dẫn-tệp-cài.dmg"`.

1. Tải đúng tệp cho máy của bạn: `win-x64.exe`, `mac-x64.dmg` (Mac Intel),
   hoặc `mac-arm64.dmg` (Apple silicon).
2. Trên Windows, mở trình cài. Bản mặc định chưa ký mã: Windows có thể hiện
   SmartScreen cảnh báo nhà phát hành chưa xác định. Chỉ tiếp tục nếu bạn đã
   tải từ trang Releases chính thức và đã kiểm tra checksum.
3. Trên macOS, mở DMG và kéo ứng dụng vào Applications. Bản mặc định chưa có
   Developer ID hoặc notarization; lần mở đầu tiên có thể cần cho phép ứng dụng
   trong **System Settings → Privacy & Security → Open Anyway**. Gói dùng chữ ký
   ad-hoc cục bộ để chạy được trên Apple silicon, không cần tài khoản Apple Developer.
4. Mở **Chánh Điện Tịnh Tâm**, nhập `@username` TikTok LIVE trong bảng điều
   khiển và bấm **Kết nối**. Ứng dụng mở cửa sổ overlay riêng khi bạn chọn nút
   tương ứng trong bảng điều khiển.

Trong TikTok LIVE Studio, thêm **Window capture** và chọn cửa sổ overlay.
Trong OBS, dùng **Browser source**, dán liên kết bằng nút **Sao chép liên kết
overlay** và đặt kích thước 1080×1920. Mặc định cổng là 3000; ứng dụng tự chọn
cổng trống khác nếu cổng đó đang được dùng. Đóng bảng điều khiển sẽ thoát ứng
dụng và dừng server. TikTok và giọng đọc cần Internet; cảnh, nhạc và dữ liệu
mô phỏng đã có sẵn trong gói cài.

Chưa live vẫn thử được: dùng **Thử tương tác**, **Đổ người mẫu 15/36/64/100** hoặc **Bot mô phỏng**.

Chi tiết ký mã Windows tùy chọn và cấu hình phát hành dành cho người quản lý
dự án nằm trong phần [Phát hành Desktop](#phát-hành-desktop-cho-người-quản-lý).

## Chạy bộ LIVE trên máy phát

Cần Node.js 20 trở lên.

Để chạy bản web và server bằng Node, cài riêng phụ thuộc của server như bên
dưới. Bản Desktop phát hành đã chứa server và phụ thuộc cần thiết; người dùng
không cần cài Node.js.

```bash
cd live
npm ci --ignore-scripts
npm start
```

1. Mở `http://localhost:3000/live/control.html` (bảng điều khiển).
2. Bấm **Mở màn hình overlay 9:16**, rồi bấm **Bật âm thanh** một lần trong cửa sổ đó (trình duyệt chặn tự phát tiếng).
3. Trong TikTok LIVE Studio: *Add source → Window capture* → chọn cửa sổ overlay. Với OBS thì dùng *Browser source* trỏ tới `http://localhost:3000/live/overlay.html`, kích thước 1080×1920.
4. Bật LIVE trên TikTok, nhập `@username` vào bảng điều khiển, bấm **Kết nối**.

## Phát hành Desktop cho người quản lý

Máy phát triển cần Node.js 22.12 trở lên. Cài phụ thuộc riêng cho server và ứng
dụng Desktop, sau đó chạy ứng dụng hoặc tạo gói cho hệ điều hành hiện tại:

```bash
npm ci --prefix live --ignore-scripts
npm ci --prefix desktop
npm --prefix desktop start
npm --prefix desktop run dist
```

`npm --prefix desktop run dist:win` tạo trình cài Windows x64.
`npm --prefix desktop run dist:mac -- --x64` hoặc
`npm --prefix desktop run dist:mac -- --arm64` tạo DMG cho kiến trúc macOS tương ứng.
Chỉnh `desktop/icons/icon.svg` rồi chạy `npm --prefix desktop run icons` để
tạo lại PNG, ICO và ICNS từ bản vector. Công cụ build chỉ chạy khi phát triển;
người dùng bản phát hành không cần cài chúng.
Giữ `mac.extendInfo.CFBundleName` ở dạng Unicode NFD để tên helper macOS khớp
với tên ứng dụng có dấu; đổi tên sản phẩm cần cập nhật giá trị này tương ứng.
Mỗi bản `vX.Y.Z` phải khớp phiên bản trong `desktop/package.json` và
`live/package.json`. Pull request tạo gói và chạy kiểm tra smoke trên Windows
x64, macOS Intel và macOS Apple silicon, bao gồm cài từ installer/DMG và chạy
ứng dụng đã cài trong đường dẫn có dấu và khoảng trắng. Gắn thẻ phiên bản sẽ phát hành một
GitHub Release sau khi cả ba bản build và smoke đều đạt; ghi chú phát hành
được GitHub tạo tự động và kèm checksum SHA-256. Các lệnh build luôn tắt tự
đăng tải; chỉ bước phát hành sau toàn bộ kiểm tra mới đưa tệp lên Releases.

Mặc định, workflow đăng Release vào cùng repository. Nếu mã nguồn ở repository
riêng tư, hãy đặt Actions variable `RELEASE_REPOSITORY` thành repository công
khai dùng để phân phối và secret `RELEASE_TOKEN` thành token chỉ có quyền tạo
release/tải tệp ở repository đó. Repository nguồn hiện được cấu hình làm đích
mặc định; workflow kiểm tra đích phải công khai trước khi phát hành. Nếu dùng
repository phát hành riêng, thẻ ở repository đó chỉ định vị bản tải xuống;
mã nguồn chính xác được xác định bằng commit của repository nguồn trong ghi
chú phát hành và tệp mã nguồn đi kèm.

### Ký mã Windows miễn phí tùy chọn

Build mặc định không ký mã. Người quản lý có thể đăng ký dự án mã nguồn mở với
[SignPath Foundation](https://signpath.org/terms), hoàn tất điều kiện xét
duyệt, kết nối GitHub.com làm Trusted Build System trong SignPath và liên kết
repository này với project ký mã. Tính năng này không tự bật khi chỉ cài
dependencies.

Sau khi được chấp nhận, tạo các Actions variables:
`SIGNPATH_ENABLED=true`, `SIGNPATH_ORGANIZATION_ID`, `SIGNPATH_PROJECT_SLUG`,
`SIGNPATH_SIGNING_POLICY_SLUG`, `SIGNPATH_APP_ARTIFACT_CONFIGURATION`,
`SIGNPATH_INSTALLER_ARTIFACT_CONFIGURATION`; lưu API token có quyền submit
đúng project/policy ở secret `SIGNPATH_API_TOKEN`. Cấu hình artifact của SignPath
có gốc `<zip-file>`, giữ nguyên cấu trúc các tệp tải lên, ký executable trong
thư mục ứng dụng ở bước đầu và installer NSIS ở bước cuối. Không ký lại các
executable của thư viện bên thứ ba. Khi bật cờ nhưng thiếu cấu hình hoặc một yêu cầu ký thất bại, workflow
dừng và không phát hành bản Windows đó. SignPath Foundation yêu cầu đăng ký,
xét duyệt và yêu cầu người quản lý chấp thuận từng yêu cầu ký; workflow chờ
tối đa 30 phút cho mỗi bước. Ký mã miễn phí không được
bảo đảm tự động, và chữ ký không đảm bảo Windows SmartScreen sẽ bỏ cảnh báo.

### Người xem làm được gì

- **Bình luận bất kỳ**: được vào ngồi (tối đa 100 chỗ, chỗ ngồi tự mở rộng 24 → 36 → 64 → 100). Đầy chỗ thì người im lặng lâu nhất mà chưa tặng quà sẽ nhường chỗ.
- **Bình luận đúng một từ** `nam`, `nữ`, `sư`, `ni`, `tiểu`, `bà`, `cao tăng`: đổi hình nhân vật. Câu "Nam mô A Di Đà Phật" không bị hiểu nhầm thành "nam".
- **Tặng quà**: banner xướng tên, giọng đọc hồi hướng (lấy lời nguyện từ bình luận gần nhất của người đó nếu có), hiệu ứng theo giá trị quà, cộng điểm vào bảng Công Đức.
- **Thả tim**: tim bay trên đầu nhân vật.

## Bảo mật

Dự án được viết để ai tải về chạy cũng an toàn mặc định:

- **Không dùng tài khoản TikTok.** Server chỉ đọc sự kiện công khai của phòng live theo username. Không cần, không hỏi và không lưu mật khẩu, cookie hay session. Không gửi tin nhắn thay bạn.
- **Chỉ mở trên máy mình.** Server lắng nghe `127.0.0.1`, máy khác trong mạng hay Internet không truy cập được. Muốn mở ra ngoài phải tự đặt biến `HOST`. Không nên làm vậy khi chưa thêm đăng nhập.
- **Chặn trang web lạ điều khiển.** WebSocket chỉ nhận kết nối từ chính trang của server (kiểm tra `Origin`), và header `Host` phải là localhost (chống DNS rebinding). Một trang web khác đang mở trong cùng trình duyệt không gửi được lệnh. Cửa sổ overlay chỉ nhận dữ liệu, không gửi lệnh được.
- **File tĩnh có danh sách trắng.** Chỉ phục vụ `/assets` và `/live`. Chặn file ẩn (`.git`, `.env`), `node_modules`, mã server, `package.json` và mọi đường dẫn `../`.
- **Không tin dữ liệu vào.** Tên người xem, bình luận và tên quà đều bị cắt độ dài. Cài đặt chỉ nhận đúng khóa, đúng kiểu, trong giới hạn. Văn bản đưa vào giọng đọc được escape XML. Mọi chữ trên màn hình vẽ bằng `textContent` hoặc canvas, không chèn HTML, nên bình luận chứa mã độc chỉ hiện ra như chữ thường.
- **Chống spam.** Hàng đợi giọng đọc tối đa 15 câu. Bình luận thường không đọc thành tiếng.
- **Phụ thuộc ghim phiên bản** trong `live/package.json`: `ws`, `msedge-tts`, `tiktok-live-connector`. Không có khóa API nào trong mã.

Các lớp trên đã được thử: đường dẫn `../`, `%2e%2e`, `.git/config`, `server.mjs`, `package.json` đều trả 404. Host giả trả 421. WebSocket từ Origin lạ bị từ chối. Lệnh gửi từ overlay bị bỏ qua. Cài đặt sai kiểu bị kẹp về giới hạn.

### Lưu ý

- `tiktok-live-connector` là thư viện cộng đồng, không phải API chính thức của TikTok. Nó có thể ngừng chạy khi TikTok đổi hệ thống. Kiểm tra điều khoản TikTok trước khi dùng cho kênh của bạn.
- Giọng đọc dùng dịch vụ Read Aloud của Microsoft Edge qua mạng (giọng Nam Minh, Hoài My). Máy phát cần có Internet.
- Hình ảnh trong `assets/` được tạo bằng Google Flow, nhạc nền tạo bằng Gemini. Kiểm tra điều khoản của các dịch vụ đó trước khi dùng thương mại, hoặc thay bằng tài nguyên của bạn.

## Miễn trừ trách nhiệm

Dự án được chia sẻ **miễn phí, với mục đích học tập và tham khảo lập trình**. Phần mềm được cung cấp "nguyên trạng" (AS IS), không kèm bất kỳ bảo đảm nào, rõ ràng hay ngụ ý.

Khi tải về, sử dụng, chỉnh sửa hoặc phân phối lại mã nguồn này, **bạn tự chịu hoàn toàn trách nhiệm** về:

- Mọi nội dung bạn phát trên livestream hoặc đăng tải, bao gồm hình ảnh, âm thanh, giọng đọc, lời nguyện, bình luận được hiển thị.
- Việc nhận quà, donation hoặc bất kỳ khoản thu nào từ người xem.
- Việc tuân thủ điều khoản sử dụng của TikTok và các nền tảng, dịch vụ bên thứ ba khác (thư viện đọc sự kiện TikTok là thư viện cộng đồng, không chính thức).
- Việc tuân thủ pháp luật nơi bạn sinh sống và hoạt động, kể cả quy định về hoạt động tôn giáo, quảng cáo, thuế và bản quyền.
- Mọi rủi ro và thiệt hại phát sinh, trực tiếp hay gián tiếp, như bị khóa tài khoản, bị dừng live, mất dữ liệu, tranh chấp hay khiếu nại.

Tác giả **không liên quan, không bảo trợ và không chịu trách nhiệm** đối với bất kỳ kênh, tài khoản, sản phẩm hay hoạt động nào sử dụng mã nguồn này. Dự án không đại diện cho bất kỳ chùa, tu viện hay tổ chức tôn giáo nào. Khi dùng nội dung liên quan đến Phật giáo, xin giữ sự tôn kính và không dùng vào mục đích lừa đảo, trục lợi hay xúc phạm niềm tin của người khác.

Việc sử dụng mã nguồn đồng nghĩa với việc bạn đã đọc và đồng ý với các điều trên.

> **Disclaimer (EN):** This project is shared free of charge for educational purposes only and is provided "AS IS", without warranty of any kind. Anyone who uses, modifies or redistributes it is solely responsible for their own content, streams, donations, compliance with TikTok and other platforms' terms, and applicable laws. The author is not affiliated with, does not endorse, and accepts no liability for any channel, account, product or activity built with this code, nor for any direct or indirect damages.

## Ủng hộ tác giả

Dự án chia sẻ miễn phí. Nếu thấy hữu ích và muốn góp chút công đức để tác giả duy trì và làm thêm tính năng, bạn có thể chuyển khoản:

| | |
|---|---|
| Ngân hàng | **MB Bank** |
| Số tài khoản | **999979798886** |
| Chủ tài khoản | **HUYNH HUU NHAN** |

![QR chuyển khoản MB Bank](https://img.vietqr.io/image/MB-999979798886-compact2.png?accountName=HUYNH%20HUU%20NHAN&addInfo=Ung%20ho%20Chanh%20Dien%20Online)

Xin cảm ơn và chúc bạn thân tâm an lạc. Nam mô A Di Đà Phật.

## Giấy phép

MIT, xem `LICENSE`.
