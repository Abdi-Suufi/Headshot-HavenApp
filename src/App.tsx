import React, { useState } from 'react'
import { Box, VStack, HStack, Text, useColorModeValue } from '@chakra-ui/react'
import AimTraining from './components/games/AimTraining'

const App = () => {
  const [currentPage, setCurrentPage] = useState('aim-training')
  
  const bgColor = useColorModeValue('gray.800', 'gray.900')
  const navBgColor = useColorModeValue('gray.700', 'gray.800')
  const textColor = useColorModeValue('white', 'white')
  const hoverBgColor = useColorModeValue('gray.600', 'gray.700')

  const renderContent = () => {
    switch (currentPage) {
      case 'aim-training':
        return <AimTraining />
      default:
        return <Text color={textColor}>Select a game from the navigation</Text>
    }
  }

  return (
    <HStack spacing={0} h="100vh" w="100vw" overflow="hidden">
      {/* Left Navigation */}
      <VStack
        w="200px"
        h="100%"
        bg={navBgColor}
        spacing={0}
        align="stretch"
      >
        <Box p={4}>
          <Text fontSize="xl" fontWeight="bold" color={textColor}>
            Headshot Haven
          </Text>
        </Box>
        
        <VStack spacing={0} align="stretch">
          <Box
            p={4}
            cursor="pointer"
            _hover={{ bg: hoverBgColor }}
            bg={currentPage === 'aim-training' ? hoverBgColor : 'transparent'}
            onClick={() => setCurrentPage('aim-training')}
          >
            <Text color={textColor}>Aim Training</Text>
          </Box>
        </VStack>
      </VStack>

      {/* Main Content */}
      <Box flex={1} h="100%" bg={bgColor} p={4}>
        {renderContent()}
      </Box>
    </HStack>
  )
}

export default App 