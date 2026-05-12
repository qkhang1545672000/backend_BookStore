export const sendEmail = (email, username, id) => {
  return (mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Xác nhận đăng ký tài khoản Bookstore",
    html: `
            <h1>Chào mừng ${username}!</h1>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại Bookstore.</p>
            <p>Vui lòng nhấn vào đây để kích hoạt tài khoản của bạn:</p>
           <p><a href="http://localhost:21926/api/users/verify/${id}">để xác thực.</a> </p>
          `,
  });
};
