import React from 'react';
import { useSelector } from 'react-redux';

const TestRedux = () => {
  const auth = useSelector((state) => state.auth);
  return <div>Redux is working! User: {auth.user?.name || 'No user'}</div>;
};

export default TestRedux;