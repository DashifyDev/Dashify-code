import React from 'react'
import { List, ListItem, ListItemText } from '@mui/material'
import Link from 'next/link'
import '../styles/styles.css'

function Login() {
  return (
    <div className='login'>
        <List>
          <ListItem>
  <ListItemText>
    <a href="/api/auth/login" className="login_btn">Log in</a>
  </ListItemText>
  <ListItemText>
    <a href="/api/auth/login?screen_hint=signup" className="sign_btn">Sign up</a>
  </ListItemText>
</ListItem>
        </List>      
    </div>
  )
}

export default Login
