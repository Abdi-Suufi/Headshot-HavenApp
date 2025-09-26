import React, { useEffect, useRef, useState } from 'react'
import { Box, Button, HStack, Text, VStack, useColorModeValue } from '@chakra-ui/react'

const AimTraining = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isPlaying, setIsPlaying] = useState(false)
  const [targets, setTargets] = useState<{ x: number; y: number; radius: number }[]>([])
  const [gameInterval, setGameInterval] = useState<NodeJS.Timeout | null>(null)

  const bgColor = useColorModeValue('gray.800', 'gray.900')
  const targetColor = useColorModeValue('red.500', 'red.400')
  const canvasBgColor = useColorModeValue('gray.100', 'gray.700')
  const canvasBorderColor = useColorModeValue('gray.300', 'gray.600')

  const createTarget = (canvas: HTMLCanvasElement) => {
    const radius = 20
    return {
      x: Math.random() * (canvas.width - radius * 2) + radius,
      y: Math.random() * (canvas.height - radius * 2) + radius,
      radius
    }
  }

  const spawnTarget = () => {
    if (!canvasRef.current) return
    const newTarget = createTarget(canvasRef.current)
    setTargets([newTarget])
  }

  const startGame = () => {
    if (!canvasRef.current) return
    
    setScore(0)
    setTimeLeft(60)
    setTargets([])
    setIsPlaying(true)
    
    // Clear any existing interval
    if (gameInterval) clearInterval(gameInterval)
    
    // Spawn initial target
    spawnTarget()
    
    // Set up game timer
    const timer = setInterval(() => {
      const newTime = timeLeft - 1
      if (newTime <= 0) {
        endGame()
        setTimeLeft(0)
      } else {
        setTimeLeft(newTime)
      }
    }, 1000)
    setGameInterval(timer)
  }

  const endGame = () => {
    setIsPlaying(false)
    if (gameInterval) clearInterval(gameInterval)
    setGameInterval(null)
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isPlaying) return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Check if click hit any target
    const hitTargetIndex = targets.findIndex(target => {
      const distance = Math.sqrt(
        Math.pow(x - target.x, 2) + Math.pow(y - target.y, 2)
      )
      return distance <= target.radius
    })
    
    if (hitTargetIndex !== -1) {
      setScore(score + 1)
      spawnTarget()
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }
    
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw targets
      targets.forEach(target => {
        ctx.beginPath()
        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2)
        ctx.fillStyle = targetColor
        ctx.fill()
        ctx.closePath()
      })
      
      requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [targets, targetColor])

  return (
    <VStack spacing={4} w="full">
      <HStack w="full" justify="space-between">
        <Text fontSize="xl" fontWeight="bold" color="white">Score: {score}</Text>
        <Text fontSize="xl" fontWeight="bold" color="white">Time: {timeLeft}s</Text>
      </HStack>
      
      <Box 
        w="full" 
        h="600px" 
        bg={bgColor} 
        borderRadius="lg" 
        overflow="hidden"
        position="relative"
      >
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          style={{
            width: '100%',
            height: '100%',
            cursor: 'crosshair',
            display: 'block',
            backgroundColor: canvasBgColor,
            border: `1px solid ${canvasBorderColor}`,
            borderRadius: '0.5rem'
          }}
        />
      </Box>
      
      <Button
        colorScheme="red"
        size="lg"
        onClick={isPlaying ? endGame : startGame}
      >
        {isPlaying ? 'End Game' : 'Start Game'}
      </Button>
    </VStack>
  )
}

export default AimTraining 