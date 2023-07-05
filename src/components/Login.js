import React from 'react'
import { List, ListItem, ListItemText } from '@mui/material'
import Link from 'next/link'
import '../styles/styles.css'

function Login() {
  return (
    <div className='login'>
        <List>
              <ListItem >
                  <ListItemText><Link href="/api/auth/login" className='login_btn'>Log in</Link></ListItemText>
                  <ListItemText><Link href="/api/auth/login" className='sign_btn'>Sign up</Link></ListItemText>
              </ListItem>
        </List>      
    </div>
  )
}

export default Login
