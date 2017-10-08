const conn = require('./conn');
const Sequelize = conn.Sequelize;

const User = conn.define('user', {
  name: {
    type: Sequelize.STRING ,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING ,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  }
});

User.authenticate = (credentials)=> {
  return User.findOne({
    where: credentials,
  })
  .then( user => {
    if(!user){
      throw new Error('BAD CREDENTIALS')
    }
    return user;
  });
};

User.findOrThrow = (id)=> {
  return User.findById(id,
    {
      include: [
        {
          model: conn.models.order,
          where: {
            status: 'ORDER'
          },
          required: false,
          include: [
            conn.models.lineItem
          ]
        }
      ]
    }
  )
  .then( user => {
    if(!user){
      throw new Error('BAD CREDENTIALS')
    }
    return user;
  });
};

module.exports = User;
