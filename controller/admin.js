


exports.signup = (req, res, next) => {
  const { username, email, } = req.body;
  if (username === 'ismail' && password === '12345') {
    req.session.isAdmin = true;
    req.session.admin = {
      username: 'ismail',
      role: 'superadmin'
    };
    res.redirect('/admin/dashoard');
  } else {
    req.flash('error', 'Incorrect login credentials');
    res.redirect('/admin/login');
  }
};

exports.getDashboard = (req, res, next) => {
  res.render('admin/dashoard'); 
};

exports.getAddUser = (req, res, next) => {
  res.render('admin/add-user');
};

exports.postAddUser = async (req, res, next) => {
    try {
        const { username, password, email, phone } = req.body;
        const balance=req.body.balance;
        console.log('//////////////////////');
        console.log(balance);
        console.log('//////////////////////');

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            req.flash('error', 'Email already exists');
            return res.redirect('/admin/user/add');
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            email,
            password: hashedPassword,
            name: username,
            phonenumber: phone
        });

        const account = await user.createAccount({ balance: balance });

        const cardNumber = await generateCardNumber();
        await account.createCard({ cardNumber });

        req.flash('success', 'User, account, and card created successfully');
        res.redirect('/admin/dashoard');

    } catch (error) {
        console.error('Error in postAddUser:', error);
        req.flash('error', 'Error creating user: ' + error.message);
        res.redirect('/admin/user/add');
    }
};

exports.processPayment = async (req, res) => {
  
    try {
        const { cardNumber, amount } = req.body;
        const paymentAmount = parseFloat(parseFloat(amount).toFixed(2)); 

        console.log('Payment data:', { cardNumber, paymentAmount });

        const card = await Card.findOne({
            where: { cardNumber },
            include: [{ model: Account, required: true }],
        });

        if (!card) throw new Error('Invalid card details');

        console.log('Current balance (before update):', card.account.balance);

        if (card.account.balance < paymentAmount) {
            throw new Error('Insufficient balance');
        }

        await sequelize.query(
            'UPDATE accounts SET balance = balance - :amount WHERE id = :accountId',
            {
                replacements: {
                    amount: paymentAmount,
                    accountId: card.account.id,
                },
                type: sequelize.QueryTypes.UPDATE,
            }
        );

       
        await card.account.reload();
        console.log('Balance after update:', card.account.balance);

        res.json({
            success: true,
            message: 'Payment processed successfully',
            newBalance: card.account.balance,
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.postCheck = async (req, res) => {
  console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhh");
  try {
    const { email, password, cardNumber } = req.body;

    const card = await Card.findOne({
      where: { cardNumber },
      include: [{
        model: Account,
        required: true,
        include: [{
          model: User 
      }],
    }]});

    if (!card) {
      throw new Error('Invalid card details');
    }
    if (!card.account || !card.account.user) {
      throw new Error('Account or user not found');
    }

    const user = card.account.user;
    
    const isEmailValid = user.email === email;
const isPasswordValid = await bcrypt.compare(password, user.password);    
    if (!isEmailValid || !isPasswordValid) {
      throw new Error('Invalid user credentials');
    }

    res.json({
      success: true,
      message: 'Authentication successful',
      userData: {
        name: user.name,
        balance: card.account.balance
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(400).json({ 
      success: false,
      message: error.message
    });
  }
};