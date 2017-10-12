import axios from 'axios';

const fetchProducts = ()=> {
  return (dispatch)=> {
    return axios.get('/api/products')
      .then(response => dispatch(productsLoaded(response.data)));
  };
};

const productsLoaded = (products)=> {
  return {
    type: 'SET_PRODUCTS',
    products
  };
};

const fetchUser = ()=> {
  return (dispatch)=> {
    return axios.get('/api/session')
      .then(response => {
        dispatch(userLoaded(response.data))
        dispatch(loadCart(response.data.id));
      })
      .catch( ex => {
        console.log('user not logged in')
        loadLocalCart(dispatch);
      })
  };
};

const loadLocalCart = (dispatch)=> {
  let cart = { lineItems: [] };
  const storage = window.localStorage;
  try{
    const contents = storage.getItem('CART');
    if(!contents){
      storage.setItem('CART', JSON.stringify(cart));
      return loadLocalCart(dispatch);
    }
    cart = JSON.parse(contents);
  }
  catch(ex){
    storage.removeItem('CART');
    return loadLocalCart(dispatch);
  }
  dispatch(cartLoaded(cart));
};

const loadCart = (userId)=> {
  return (dispatch)=> {
    return axios.get('/api/cart')
      .then(response => {
        dispatch(cartLoaded(response.data))
        return response.data;
      })
      .catch( ex => console.log('user not logged in'))
  };
};

const addToCart = ({ user, product, cart, quantity = 1 })=> {
  return (dispatch)=> {
    if(!user.id){
      let lineItem = cart.lineItems.find( lineItem => lineItem.productId === product.id);
      let lineItems;
      if(!lineItem){
        lineItem = {
          productId: product.id,
          quantity: 1
        };
        lineItems = [...cart.lineItems, lineItem];
      }
      else {
        lineItems = cart.lineItems.filter(_lineItem=> {
          if(_lineItem !== lineItem)
            return _lineItem;
          return Object.assign({}, _lineItem, { quantity: lineItem.quantity++});
        });
      }
      cart = Object.assign({}, cart, { lineItems });
      const storage = window.localStorage;
      storage.setItem('CART', JSON.stringify( cart ));
      return dispatch(cartLoaded(cart));
    }
    return axios.post(`/api/orders/${cart.id}/lineItems/`, { productId: product.id , quantity })
      .then(response => dispatch(loadCart(user.id)))
      .catch( ex => console.log('user not logged in'))
  };
};

const deleteFromCart = ({ user, lineItem, cart })=> {
  return (dispatch)=> {
    if(!user.id){
      const lineItems = cart.lineItems.filter( _lineItem=> {
        return lineItem.productId !== _lineItem.productId;
      });
      cart = Object.assign({}, cart, { lineItems });
      const storage = window.localStorage;
      storage.setItem('CART', JSON.stringify(cart));
      return dispatch(cartLoaded(cart));
    }
    return axios.delete(`/api/orders/${cart.id}/lineItems/${lineItem.id}`)
      .then(response => dispatch(loadCart(user.id)))
      .catch( ex => console.log('user not logged in'))
  };
};

const createOrder = ({ user, cart, history })=> {
  return (dispatch)=> {
    return axios.put(`/api/orders/${cart.id}/`, { status: 'ORDER' })
      .then(response => {
        dispatch(fetchUser());
        history.push('/orders');
      })
      .catch( ex => console.log(ex))
  };
};

const logout = (history)=> {
  return (dispatch)=> {
    return axios.delete('/api/session')
      .then(response => {
        dispatch(loggedOut());
        dispatch(cartLoaded({lineItems: []}));
        history.push('/');
      });
  };
};

const attemptLogin = (credentials, cart, history)=> {
  return (dispatch)=> {
    return axios.post('/api/session', credentials)
      .then(response => {
        dispatch(userLoaded(response.data));
        let localItems;
        if(cart.lineItems.length){
          const storage = window.localStorage;
          storage.removeItem('CART');
          localItems = [...cart.lineItems];
        }
        dispatch(loadCart(response.data.id))
          .then( cart => {
            localItems.forEach( lineItem => {
              dispatch(addToCart(
                { 
                  user: {id: cart.userId }, 
                  cart, 
                  quantity: lineItem.quantity,
                  product: { 
                    id: lineItem.productId, 
                  }
                }
              ));
            });
            console.log('LOCAL', localItems);

          });
        history.push('/products');
      })
      .catch( ex => {
        console.log('user not logged in')
      })
  };
};

const userLoaded = (user)=> {
  console.log(user);
  return {
    type: 'SET_USER',
    user
  };
};

const cartLoaded = (cart)=> {
  return {
    type: 'SET_CART',
    cart
  };
};

const loggedOut = ()=> {
  return {
    type: 'SET_USER',
    user: {}
  };
};

const actions = {
  addToCart,
  deleteFromCart,
  fetchProducts,
  fetchUser,
  attemptLogin,
  logout,
  createOrder
};

export default actions;