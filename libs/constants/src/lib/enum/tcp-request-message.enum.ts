enum INVOICE {
  CREATE = 'invoice.create',
  GET_BY_ID = 'invoice.get_by_id',
  UPDATE_BY_ID = 'invoice.update_by_id',
  DELETE_BY_ID = 'invoice.delete_by_id',
}

enum PRODUCT {
  CREATE = 'product.create',
  GET_LIST = 'product.get_list',
  UPDATE_BY_ID = 'product.update_by_id',
  DELETE_BY_ID = 'product.delete_by_id',
}

enum USER {
  CREATE = 'user.create',
  GET_ALL = 'user.get_all',
  GET_BY_USER_ID = 'user.get_by_user_id',
}

enum KEYCLOAK {
  CREATE_USER = 'keycloak.create_user',
}

export const TCP_REQUEST_MESSAGE = {
  INVOICE,
  PRODUCT,
  USER,
  KEYCLOAK,
};
