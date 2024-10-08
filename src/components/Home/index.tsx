import React from 'react'
import ApartmentsStorage from './ApartmentsStorage'

import './styles.scss'

const Home = () => {

  return (
    <div className='home'>
      <ApartmentsStorage />

      {/* <div style={{ width: '100%', height: '50vh', display: 'flex' }}>
        <div style={{ backgroundColor: 'green', width: '50%', height: '100%' }}>
          SHOP
        </div>
        <div style={{ backgroundColor: 'red', width: '50%', height: '100%' }}>
          Download
        </div>
      </div> */}
    </div>
  )
}

export default Home