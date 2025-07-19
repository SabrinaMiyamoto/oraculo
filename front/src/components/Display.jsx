import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import OraculoModal from './OraculoModal';
import Interpretacao from './Interpretacao';

// Imagens (certifique-se de que os caminhos estão corretos)
import begging from '../img/begging.png';
import aftermodal from '../img/aftermodal.png';
import closed from '../img/closed.png';
import opend from '../img/opend.png';
import WhiteClosed from '../img/WhiteClosed.png';
import WhiteOpend from '../img/WhiteOpend.png';
import CentCoin from '../img/centCoin.png';
import TailsCoin from '../img/TailsCoin.png';
import ring from '../img/ring.png';

const Display = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [showModal, setShowModal] = useState(false);
  const [started, setStarted] = useState(false);
  const [results, setResults] = useState(null);

  const containerRef = useRef(null);

  useEffect(() => {
    if (results) {
      console.log('--- Início das Posições Geradas ---');
      if (results.buziosPositions) {
        results.buziosPositions.forEach((pos, i) => {
          console.log(`Búzio ${i + 1}: Left=${pos.left}, Top=${pos.top}`);
        });
      }
      if (results.coinPosition) {
          console.log(`Moeda: Left=${results.coinPosition.left}, Top=${results.coinPosition.top}`);
      }
      if (results.ringPosition) {
          console.log(`Anel: Left=${results.ringPosition.left}, Top=${results.ringPosition.top}`);
      }
      console.log('--- Fim das Posições Geradas ---');
    }
    console.log('Estado "started":', started);
    console.log('Estado "results":', results);
  }, [results, started]);


  useEffect(() => {
    let retryTimeout;

    const generateAndSetResults = () => {
      if (!started || results) {
        return;
      }

      if (!containerRef.current) {
        console.warn("containerRef.current não está disponível ainda. Tentando novamente em 50ms.");
        retryTimeout = setTimeout(generateAndSetResults, 50);
        return;
      }

      const currentWidth = containerRef.current.offsetWidth;
      const currentHeight = containerRef.current.offsetHeight;

      if (currentWidth === 0 || currentHeight === 0) {
        console.warn("Dimensões do contêiner são 0. Tentando novamente em 50ms.");
        retryTimeout = setTimeout(generateAndSetResults, 50);
        return;
      }

      console.log("Iniciando geração de posições após montagem e com dimensões válidas.");
      console.log('Dimensões do Contêiner Usadas para Geração:', { width: currentWidth, height: currentHeight });

      const generatedNormalBuzios = Array.from({ length: 13 }, () =>
        Math.random() > 0.5 ? 'opend' : 'closed'
      );
      const generatedWhiteBuzio = Math.random() > 0.5 ? 'WhiteOpend' : 'WhiteClosed';
      const generatedCoin = Math.random() > 0.5 ? 'CentCoin' : 'TailsCoin';
      const generatedRingIndex = Math.floor(Math.random() * 14);

      let tempVisualBuzios = [...generatedNormalBuzios];
      const visualWhiteBuzioPosition = Math.floor(Math.random() * 14);
      tempVisualBuzios.splice(visualWhiteBuzioPosition, 0, generatedWhiteBuzio);

      // Chamando generateRandomPosition sem o parâmetro elementSize
      const buziosPositions = tempVisualBuzios.map(() => generateRandomPosition(currentWidth, currentHeight));
      const coinPosition = generateRandomPosition(currentWidth, currentHeight);
      const ringPosition = generateRandomPosition(currentWidth, currentHeight);

      const newResults = {
        buziosForDisplay: tempVisualBuzios,
        ringIndex: generatedRingIndex,
        buzios: generatedNormalBuzios,
        whiteBuzio: generatedWhiteBuzio,
        coin: generatedCoin,
        buziosPositions: buziosPositions,
        coinPosition: coinPosition,
        ringPosition: ringPosition,
      };

      setResults(newResults);
    };

    if (started && !results) {
      generateAndSetResults();
    }

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [started, results]);

  const generateRandomPosition = (containerWidth, containerHeight) => {
    // A porcentagem de raio máximo para dispersão
    // Ajustado para 55% (mobile) e 85% (desktop) para melhor dispersão e evitar cortes
    const maxRadiusPercentage = isSmallScreen ? 0.55 : 0.85; 
    
    // Adiciona um padding para garantir que os elementos não fiquem muito próximos das bordas
    // Ajustado para ser uma porcentagem do tamanho do contêiner para melhor responsividade
    const paddingPercentage = isSmallScreen ? 0.05 : 0.02;
    const effectivePaddingX = containerWidth * paddingPercentage;
    const effectivePaddingY = containerHeight * paddingPercentage;

    const effectiveContainerWidth = containerWidth - effectivePaddingX * 2;
    const effectiveContainerHeight = containerHeight - effectivePaddingY * 2;
    const maxRadiusPx = Math.min(effectiveContainerWidth, effectiveContainerHeight) * maxRadiusPercentage / 2;

    if (maxRadiusPx <= 0) {
      console.warn("maxRadiusPx é zero ou negativo, retornando posição central.");
      return { left: `${containerWidth / 2}px`, top: `${containerHeight / 2}px` };
    }

    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * maxRadiusPx;

    const offsetX = radius * Math.cos(angle);
    const offsetY = radius * Math.sin(angle);

  
    const finalLeft = containerWidth / 2 + offsetX;
    const finalTop = containerHeight / 2 + offsetY;

    console.log(`generateRandomPosition - container: (${containerWidth}x${containerHeight}), maxRadiusPercentage: ${maxRadiusPercentage.toFixed(2)}, maxRadiusPx: ${maxRadiusPx.toFixed(2)}, offsetX: ${offsetX.toFixed(2)}, offsetY: ${offsetY.toFixed(2)}, finalLeft: ${finalLeft.toFixed(2)}px, finalTop: ${finalTop.toFixed(2)}px`);

    return { left: `${finalLeft}px`, top: `${finalTop}px` };
  };

  const startGame = () => {
    setShowModal(false);
    setStarted(true);
  };

  const imageMap = {
    opend,
    closed,
    WhiteOpend,
    WhiteClosed,
    CentCoin,
    TailsCoin,
    ring,
  };

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: '80vh', sm: '85vh', md: '100vh' },
          backgroundImage: `url(${started ? aftermodal : begging})`,
          backgroundSize: 'cover',
          objectFit: 'contain',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!started && (
          <Button
            variant="contained"
            onClick={() => setShowModal(true)}
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' },
              px: { xs: 3, sm: 4 },
              py: { xs: 1, sm: 1.5 },
              bgcolor: theme.palette.secondary.main,
              color: theme.palette.background.default,
              '&:hover': {
                bgcolor: theme.palette.secondary.dark,
              },
            }}
          >
            Abrir Oráculo
          </Button>
        )}

        <OraculoModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={startGame}
        />

        {started && (
          <Box
            ref={containerRef}
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              border: '2px dashed red', // Borda temporária para depuração visual 
            }}
          >
            {results && Array.isArray(results.buziosForDisplay) && (
              <>
                {results.buziosForDisplay.map((estado, index) => {
                  const { left, top } = results.buziosPositions[index];
                4
                  const buziosSize = { xs: 56, sm: 88, md: 104 };

                  return (
                    <Box
                      key={`buzio-box-${index}`}
                      component={motion.div}
                      initial={{
                        top: '50%',
                        left: '50%',
                        rotate: Math.random() * 360,
                        opacity: 0,
                      }}
                      animate={{
                        left: left, 
                        top: top,
                        rotate: Math.random() * 360,
                        opacity: 1,
                      }}
                      transition={{
                        duration: 1.5,
                        delay: index * 0.1,
                        type: 'spring',
                        stiffness: 60,
                        damping: 10,
                      }}
                      sx={{
                        position: 'absolute',
                        transform: 'translate(-50%, -50%)',
                        width: buziosSize,
                        height: buziosSize,
                        flexShrink: 0,
                        flexGrow: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <img
                        src={imageMap[estado]}
                        alt={`búzio ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                      />
                    </Box>
                  );
                })}

                {results.coin && results.coinPosition && (
                  <Box
                    component={motion.div}
                    initial={{
                        top: '50%',
                        left: '50%',
                        opacity: 0
                    }}
                    animate={{
                      left: results.coinPosition.left,
                      top: results.coinPosition.top,
                      opacity: 1,
                    }}
                    transition={{ duration: 1.5, delay: 1.8, type: 'spring', stiffness: 60, damping: 10 }}
                    sx={{
                      position: 'absolute',
                      transform: 'translate(-50%, -50%)',
                      width:  { xs: 16, sm: 48, md: 80 },
                      height:  { xs: 16, sm: 48, md: 80 },
                      flexShrink: 0,
                      flexGrow: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <img 
                      src={imageMap[results.coin]}
                      alt="moeda"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    />
                  </Box>
                )}

                {results.ringIndex !== undefined && results.ringPosition && (
                  <Box
                    component={motion.div}
                    initial={{
                        top: '50%',
                        left: '50%',
                        scale: 0,
                        opacity: 0
                    }}
                    animate={{
                        scale: 1,
                        opacity: 1,
                        left: results.ringPosition.left,
                        top: results.ringPosition.top,
                    }}
                    transition={{ delay: 2.2, duration: 1, type: 'spring', stiffness: 60, damping: 10 }}
                    sx={{
                      position: 'absolute',
                      transform: 'translate(-50%, -50%)',

                      width: { xs: 24, sm: 48, md: 88 },
                      height: { xs: 24, sm: 48, md: 88 },
                      flexShrink: 0,
                      flexGrow: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <img
                      src={imageMap.ring}
                      alt="aliança"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        )}
      </Box>

      {started && results && (
        <Box
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            overflowY: 'auto',
            minHeight: { xs: '20vh', sm: '15vh', md: '10vh' },
          }}
        >
          <Interpretacao results={results} />
        </Box>
      )}
    </Box>
  );
};

export default Display;
