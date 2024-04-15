import { PolicyType } from 'shared/enums/policy.enum';

export const seedDataPolicy = () => [
  // PRODUCT
  {
    name: 'Mô tả chi tiết sản phẩm',
    content: 'Mô tả chi tiết về tình trạng, tuổi thọ, và bất kỳ lỗi nào của sản phẩm.',
    type: PolicyType.PRODUCT,
  },
  {
    name: 'Chất lượng hình ảnh',
    content:
      'Đảm bảo hình ảnh của sản phẩm là chất lượng và minh bạch, hiển thị tất cả các góc cạnh và chi tiết quan trọng của sản phẩm.',
    type: PolicyType.PRODUCT,
  },
  {
    name: 'Chính sách bảo hành',
    content: 'Xác định thời gian bảo hành và điều kiện áp dụng cho sản phẩm.',
    type: PolicyType.PRODUCT,
  },
  {
    name: 'Chính sách đổi trả và hoàn tiền',
    content: 'Quy định rõ ràng về việc đổi trả hoặc hoàn tiền cho sản phẩm nếu không đạt yêu cầu hoặc gặp sự cố.',
    type: PolicyType.PRODUCT,
  },
  {
    name: 'Giá cả và phí giao hàng',
    content: 'Thông báo giá cả và phí vận chuyển của sản phẩm một cách rõ ràng và minh bạch.',
    type: PolicyType.PRODUCT,
  },
  {
    name: 'Danh sách sản phẩm liên quan',
    content:
      'Cung cấp danh sách các sản phẩm liên quan hoặc thay thế cho sản phẩm đã chọn, để khách hàng có nhiều sự lựa chọn hơn.',
    type: PolicyType.PRODUCT,
  },
  {
    name: 'Chính sách về sản phẩm mới và cũ',
    content:
      'Đánh dấu rõ ràng sản phẩm là mới hay đã qua sử dụng, và cung cấp thông tin về tuổi thọ và tình trạng của sản phẩm đã qua sử dụng.',
    type: PolicyType.PRODUCT,
  },
  {
    name: 'Thông tin kỹ thuật và mô hình sản phẩm',
    content: 'Cung cấp thông tin kỹ thuật cơ bản và mô hình của sản phẩm để khách hàng có thể xác định rõ ràng sản phẩm.',
    type: PolicyType.PRODUCT,
  },
  {
    name: 'Xác nhận tính hợp pháp của sản phẩm',
    content: 'Đảm bảo rằng sản phẩm được bán đúng cách và tuân thủ các quy định và quy định pháp lý áp dụng.',
    type: PolicyType.PRODUCT,
  },
  {
    name: 'Nghiêm cấm hành vi',
    content:
      'Phản động, chống phá, bài xích tôn giáo, khiêu dâm, bạo lực, đi ngược lại thuần phong mỹ tục, truyền thống và văn hóa Việt Nam, xâm phạm chủ quyền, toàn vẹn lãnh thổ, an ninh quốc gia của Việt Nam;',
    type: PolicyType.PRODUCT,
  },
  {
    name: 'Nghiêm cấm hành vi',
    content: 'Đăng thông tin rác, phá rối hay làm mất uy tín của các dịch vụ do Shopee cung cấp;',
    type: PolicyType.PRODUCT,
  },
  {
    name: 'Nghiêm cấm hành vi',
    content: 'Xúc phạm, khích bác đến người khác dưới bất kỳ hình thức nào;',
    type: PolicyType.PRODUCT,
  },
  {
    name: 'Nghiêm cấm hành vi',
    content:
      'Tuyên truyền về những thông tin mà pháp luật nghiêm cấm như: sử dụng heroin, thuốc lắc, giết người, cướp của,vv… (Ví dụ: sản phẩm in hình lá cần sa, shisha);',
    type: PolicyType.PRODUCT,
  },
  {
    name: 'Nghiêm cấm hành vi',
    content: 'Khuyến khích, quảng cáo cho việc sử dụng các sản phẩm độc hại (VD: thuốc lá, rượu, cần sa);',
    type: PolicyType.PRODUCT,
  },
  {
    name: 'Nghiêm cấm hành vi',
    content: 'Các sản phẩm văn hóa đồi trụy (băng đĩa, sách báo, vật phẩm);',
    type: PolicyType.PRODUCT,
  },
  {
    name: 'Nghiêm cấm hành vi',
    content: 'Tài liệu bí mật quốc gia, bí mật nhà nước, bí mật kinh doanh, bí mật cá nhân;',
    type: PolicyType.PRODUCT,
  },
  {
    name: 'Nghiêm cấm hành vi',
    content: 'Con người và/hoặc các bộ phận của cơ thể con người;',
    type: PolicyType.PRODUCT,
  },
  {
    name: 'Nghiêm cấm hành vi',
    content:
      'Động vật và chế phẩm từ động vật (bao gồm động vật hoang dã) như: chó, mèo, cá, ốc, chuột, nhím, ốc mượn hồn, hamster, ngà voi, sừng tê giác, cao hổ, da/ lông động vật,...',
    type: PolicyType.PRODUCT,
  },
  {
    name: 'Nghiêm cấm hành vi',
    content: 'Những sản phẩm có tính chất phân biệt chủng tộc, xúc phạm đến dân tộc hoặc quốc gia nào đó;',
    type: PolicyType.PRODUCT,
  },

  // USER
  {
    name: 'Chính sách hoàn trả',
    content:
      'Người dùng được quyền hoàn trả lại đơn hàng trong vòng 3 ngày kể từ lúc nhận hàng thành công. Ngoài thời gian trên hệ thống sẽ không đáp ứng nhu cầu hoàn trả đơn của người dùng.',
    type: PolicyType.USER,
  },
  {
    name: 'Chính sách hoàn trả',
    content:
      'Trong trường hợp người dùng đặt nhiều đơn hàng cùng một lúc thuộc một cửa hàng, nếu muốn hoàn trả lại một trong số những sản phẩm đó. Vui lòng liên hệ để trao đổi trực tiếp với cửa hàng.',
    type: PolicyType.USER,
  },
  {
    name: 'Chính sách hoàn trả',
    content:
      'Đối với trường hợp người dùng đặt hàng, nhận hàng thành công và sau đó hoàn lại đơn hàng liên tiếp 3 lần. Hệ thống sẽ hạn chế quyền sử dụng khuyến mãi của hệ thống trong vòng 30 ngày.',
    type: PolicyType.USER,
  },
  {
    name: 'Chính sách bảo mật thông tin cá nhân',
    content:
      'Người dùng cần tuân thủ chính sách bảo mật thông tin cá nhân của cửa hàng, bao gồm việc không chia sẻ thông tin cá nhân với bên thứ ba và đảm bảo rằng thông tin đăng ký là chính xác và cập nhật.',
    type: PolicyType.USER,
  },
  {
    name: 'Chính sách về nội dung người dùng',
    content:
      'Người dùng cần tuân thủ các quy định về nội dung người dùng, bao gồm việc không đăng tải hoặc chia sẻ nội dung xâm hại đến quyền riêng tư, bảo mật hoặc danh dự của người khác.',
    type: PolicyType.USER,
  },
  {
    name: 'Chính sách về thanh toán và giao dịch',
    content:
      'Người dùng cần tuân thủ các quy định về thanh toán và giao dịch, bao gồm việc sử dụng phương thức thanh toán hợp lệ và không gian lận trong quá trình giao dịch.',
    type: PolicyType.USER,
  },
  {
    name: 'Chính sách về sử dụng hợp pháp',
    content:
      'Người dùng cần tuân thủ các quy định về sử dụng hợp pháp của hệ thống, bao gồm việc không sử dụng hệ thống cho mục đích bất hợp pháp hoặc vi phạm pháp luật.',
    type: PolicyType.USER,
  },
  {
    name: 'Chính sách về bản quyền',
    content:
      'Người dùng cần tuân thủ các quy định về bản quyền của cửa hàng, bao gồm việc không sao chép, phân phối hoặc sử dụng nội dung trái phép có bản quyền.',
    type: PolicyType.USER,
  },
  {
    name: 'Chính sách về sử dụng dịch vụ',
    content:
      'Người dùng cần tuân thủ các quy định về sử dụng dịch vụ của hệ thống, bao gồm việc không gây trở ngại hoặc làm gián đoạn dịch vụ cho người dùng khác.',
    type: PolicyType.USER,
  },
  {
    name: 'Chính sách về phản hồi và đánh giá',
    content: 'Người dùng cần tuân thủ các quy định về phản hồi và đánh giá sản phẩm và dịch vụ một cách công bằng và tích cực.',
    type: PolicyType.USER,
  },
  {
    name: 'Chính sách về an toàn và bảo mật',
    content:
      'Người dùng cần tuân thủ các biện pháp an toàn và bảo mật của hệ thống, bao gồm việc không thực hiện các hành động gian lận, tấn công hoặc xâm nhập vào hệ thống.',
    type: PolicyType.USER,
  },
  {
    name: 'Chính sách về việc chấp nhận điều khoản và điều kiện',
    content: 'Người dùng cần tuân thủ việc chấp nhận điều khoản và điều kiện sử dụng của hệ thống trước khi sử dụng dịch vụ.',
    type: PolicyType.USER,
  },
  {
    name: 'Chính sách về sử dụng cookie và dữ liệu truy cập',
    content:
      'Người dùng cần tuân thủ các quy định về việc sử dụng cookie và dữ liệu truy cập của hệ thống, bao gồm việc đồng ý với việc thu thập và sử dụng dữ liệu cá nhân.',
    type: PolicyType.USER,
  },

  // STORE
  {
    name: 'Chính sách về sản phẩm và mô tả',
    content: 'Yêu cầu rằng mỗi sản phẩm phải có mô tả chi tiết và chính xác về tình trạng, tuổi thọ, và bất kỳ lỗi nào của nó.',
    type: PolicyType.STORE,
  },
  {
    name: 'Chính sách về giá cả và đàm phán',
    content: 'Xác định m ột chính sách giá cả cơ bản và xác định liệu có thể đàm phán giá cả với khách hàng hay không.',
    type: PolicyType.STORE,
  },
  {
    name: 'Chính sách đổi trả và hoàn tiền',
    content:
      'Thiết lập chính sách đổi trả và hoàn tiền rõ ràng và công bằng để xử lý các trường hợp như hàng lỗi, không phù hợp, hoặc không đạt yêu cầu.',
    type: PolicyType.STORE,
  },
  {
    name: 'Chính sách vận chuyển và giao hàng',
    content:
      'Cung cấp thông tin rõ ràng về chính sách vận chuyển và giao hàng, bao gồm phí vận chuyển, thời gian giao hàng, và khu vực vận chuyển.',
    type: PolicyType.STORE,
  },
  {
    name: 'Chính sách bảo mật và thanh toán',
    content: 'Bảo vệ thông tin cá nhân của khách hàng và đảm bảo an toàn cho các giao dịch thanh toán trực tuyến.',
    type: PolicyType.STORE,
  },
  {
    name: 'Chính sách về hàng giả mạo và vũ khí',
    content:
      'Cam kết không bán hoặc quảng cáo hàng giả mạo, vũ khí và có các biện pháp chống lại việc bán hàng giả mạo, vũ khí trên nền tảng của mình.',
    type: PolicyType.STORE,
  },
  {
    name: 'Chính sách về tồn kho và quản lý sản phẩm',
    content:
      'Xây dựng quy trình quản lý tồn kho hiệu quả để đảm bảo sự minh bạch và đúng đắn trong việc đánh giá số lượng và tình trạng của sản phẩm.',
    type: PolicyType.STORE,
  },
  {
    name: 'Chính sách liên quan đến bảo hành và sửa chữa',
    content:
      'Xác định thời gian và điều kiện áp dụng cho chính sách bảo hành và sửa chữa, cũng như quy định về việc bảo trì và bảo dưỡng sản phẩm.',
    type: PolicyType.STORE,
  },
  {
    name: 'Chính sách về phản hồi và đánh giá',
    content:
      'Khuyến khích khách hàng đóng góp phản hồi và đánh giá về sản phẩm và dịch vụ, và có biện pháp để giải quyết mọi vấn đề phát sinh.',
    type: PolicyType.STORE,
  },
  {
    name: 'Đạo đức kinh doanh và tuân thủ pháp luật',
    content:
      'Tuân thủ đạo đức kinh doanh và các quy định pháp luật liên quan đến bán hàng trực tuyến, bao gồm cả quy định về quảng cáo và tiếp thị.',
    type: PolicyType.STORE,
  },
];
