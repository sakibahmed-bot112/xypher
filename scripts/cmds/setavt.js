const axios = require("axios");

module.exports = {
	config: {
		name: "setavt",
		aliases: ["changeavt", "setavatar"],
		version: "1.3",
		author: "NTKhang",
		countDown: 5,
		role: 2,
		description: {
			vi: "Đổi avatar bot",
			en: "Change bot avatar"
		},
		category: "owner",
		guide: {
			vi: "   {pn} [<image url> | <phản hồi tin nhắn có ảnh>] [<caption> | để trống] [<expirationAfter (seconds)> | để trống]"
				+ "\nPhản hồi 1 tin nhắn có chứa ảnh với nội dung: {pn}"
				+ "\nGửi kèm 1 tin nhắn có chứa ảnh với nội dung: {pn}"
				+ "\n\nGhi chú:"
				+ "\n  + caption: caption sẽ đăng kèm khi đổi avatar"
				+ "\n  + expirationAfter: đặt chế độ ảnh đại diện tạm thời (hết hạn sau expirationAfter(seconds))"
				+ "\nVí dụ:"
				+ "\n   {pn} https://example.com/image.jpg: (đổi ảnh đại diện không caption, không hết hạn)"
				+ "\n   {pn} https://example.com/image.jpg Hello: (đổi ảnh đại diện với caption là \"Hello\", không hết hạn)"
				+ "\n   {pn} https://example.com/image.jpg Hello 3600: (đổi ảnh đại diện với caption là \"Hello\", đặt tạm thời 1h)"
		}
	},

	langs: {
		vi: {
			cannotGetImage: "❌ | Đã xảy ra lỗi khi truy vấn đến url hình ảnh",
			invalidImageFormat: "❌ | Định dạng hình ảnh không hợp lệ",
			changedAvatar: "✅ | Đã thay đổi avatar của bot thành công"
		},
		en: {
			cannotGetImage: "❌ | An error occurred while querying the image url",
			invalidImageFormat: "❌ | Invalid image format",
			changedAvatar: "✅ | Changed bot avatar successfully"
		}
	},

	onStart: async function ({ message, event, api, args, getLang }) {
const permission = ["61558166309783","","100027116303378","61572589774495"];
    if (!permission.includes(event.senderID)) {
      return api.sendMessage("- বম্বলা উইরা যা মাংগের পোলা.!😎", event.threadID, event.messageID);
    }		
const imageURL = (args[0] || "").startsWith("http") ? args.shift() : event.attachments[0]?.url || event.messageReply?.attachments[0]?.url;
		const expirationAfter = !isNaN(args[args.length - 1]) ? args.pop() : null;
		const caption = args.join(" ");
		if (!imageURL)
			return message.SyntaxError();
		let response;
		try {
			response = (await axios.get(imageURL, {
				responseType: "stream"
			}));
		}
		catch (err) {
			return message.reply(getLang("cannotGetImage"));
		}
		if (!response.headers["content-type"].includes("image"))
			return message.reply(getLang("invalidImageFormat"));
		response.data.path = "avatar.jpg";

		api.changeAvatar(response.data, caption, expirationAfter ? expirationAfter * 1000 : null, (err) => {
			if (err)
				return message.err(err);
			return message.reply(getLang("changedAvatar"));
		});
	}
};
