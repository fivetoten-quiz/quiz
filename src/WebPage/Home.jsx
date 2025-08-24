import React from 'react'
import MobileNav from '../Components/NavBar/MobileNav'
import SideNavUserPanel from '../Components/NavBar/SideNavUserPanel'
import TopNav from '../Components/NavBar/TopNav'

const Home = () => {

  
  return (
    <div>
      {/* desktop nav bar, left 
      - show when desktop size */}
        <TopNav/>
        <SideNavUserPanel/>   {/* This becomes your layout component */}   


      {/* mobile nav bar bottom 
      - show when mobile size */}
      <MobileNav/>
      

      

    </div>
  )
}

export default Home