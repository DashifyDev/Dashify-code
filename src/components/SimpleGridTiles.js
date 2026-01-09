'use client';

import isDblTouchTap from '@/hooks/isDblTouchTap';
import { useUpdateTile } from '@/hooks/useTile';
import MoreHorizSharpIcon from '@mui/icons-material/MoreHorizSharp';
import { memo, useCallback, useState } from 'react';
import { Rnd } from 'react-rnd';
import LazyTipTapEditor from './LazyTipTapEditor';
import OptimizedImage from './OptimizedImage';

const SimpleGridTiles = memo(
  ({
    tiles,
    onTileUpdate,
    onTileDelete,
    onTileClone,
    onTileClick,
    headerWidth,
    setHeaderWidth,
    dbUser,
    updateTilesInLocalstorage
  }) => {
    const [showOption, setShowOption] = useState(null);
    const [selectedTile, setSelectedTile] = useState(null);
    const updateTileMutation = useUpdateTile();

    const handleDragStop = useCallback(
      (e, data, tile, index) => {
        const { x, y } = data;
        e.preventDefault();

        if (x < 0 || y < 0) return;
        if (tile.x === x && tile.y === y) return;

        const updatedTile = { ...tile, x, y };

        if (dbUser) {
          updateTileMutation.mutate({
            tileId: tile._id,
            data: { x, y }
          });
        } else {
          const updatedTiles = [...tiles];
          updatedTiles[index] = updatedTile;
          onTileUpdate(updatedTiles);
          updateTilesInLocalstorage(updatedTiles);
        }
      },
      [tiles, dbUser, updateTileMutation, onTileUpdate, updateTilesInLocalstorage]
    );

    const handleResizeStop = useCallback(
      (e, direction, ref, delta, position, index) => {
        e.preventDefault();

        const updatedTile = {
          ...tiles[index],
          width: ref.style.width,
          height: ref.style.height
        };

        if (dbUser) {
          updateTileMutation.mutate({
            tileId: tiles[index]._id,
            data: { width: ref.style.width, height: ref.style.height }
          });
        } else {
          const updatedTiles = [...tiles];
          updatedTiles[index] = updatedTile;
          onTileUpdate(updatedTiles);
          updateTilesInLocalstorage(updatedTiles);
        }
      },
      [tiles, dbUser, updateTileMutation, onTileUpdate, updateTilesInLocalstorage]
    );

    const handleContentChange = useCallback(
      (tileId, newContent) => {
        if (dbUser) {
          updateTileMutation.mutate({
            tileId,
            data: { tileText: newContent }
          });
        } else {
          const updatedTiles = tiles.map(tile =>
            tile._id === tileId ? { ...tile, tileText: newContent } : tile
          );
          onTileUpdate(updatedTiles);
          updateTilesInLocalstorage(updatedTiles);
        }
      },
      [tiles, dbUser, updateTileMutation, onTileUpdate, updateTilesInLocalstorage]
    );

    const onDoubleTap = useCallback(
      (e, action, editorHtml, tile, index) => {
        if ((e.type === 'touchstart' || e.detail == 2) && action === 'link') {
          if (tile.tileLink) {
            window.open(tile.tileLink, '_blank');
          }
        } else if ((e.type === 'touchstart' || e.detail == 2) && action === 'textEditor') {
          onTileClick(tile, index);
        }
      },
      [onTileClick]
    );

    const style = useCallback(tile => {
      const isImageBackground =
        tile.tileBackground && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(tile.tileBackground);

      return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'solid 1px #ddd',
        background: tile.tileBackground && !isImageBackground ? tile.tileBackground : '#deedf0ff',
        color: 'black',
        overflowWrap: 'anywhere',
        borderRadius: '10px'
      };
    }, []);

    const isBackgroundImage = useCallback(url => {
      if (!url) return false;
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
      return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
    }, []);

    const TitlePositionStyle = useCallback(tile => {
      return {
        top: tile.titleY == 1 ? 0 : 'auto',
        bottom: tile.titleY == 3 ? 0 : 'auto',
        left: tile.titleX == 1 ? 0 : 'auto',
        right: tile.titleX == 3 ? 0 : 'auto',
        textAlign: tile.titleX == 3 ? 'right' : tile.titleX == 2 ? 'center' : 'left'
      };
    }, []);

    const changedTitlehandle = useCallback(tile => {
      let tileText = tile.tileText;
      let content = tileText;
      if (tileText) {
        if (tileText === '<div><br></div>') {
          content = '';
        }
      }
      const titleVal =
        content && tile.displayTitle ? tileText : !content && tile.displayTitle ? 'New Box' : '';
      return titleVal;
    }, []);

    return (
      <div className='simple-grid-container'>
        {tiles.map((tile, index) => (
          <Rnd
            key={tile._id}
            onMouseLeave={() => setShowOption(null)}
            className='tile'
            style={style(tile)}
            size={{ width: tile.width, height: tile.height }}
            position={{ x: tile.x, y: tile.y }}
            onDragStop={(e, d) => handleDragStop(e, d, tile, index)}
            onResizeStop={(e, direction, ref, delta, position) =>
              handleResizeStop(e, direction, ref, delta, position, index)
            }
            onDoubleClick={e => onDoubleTap(e, tile.action, tile.tileContent, tile, index)}
            minWidth={50}
            minHeight={50}
            id={tile._id}
            dragGrid={[5, 5]}
            onTouchStart={e => {
              if (isDblTouchTap(e)) {
                onDoubleTap(e, tile.action, tile.tileContent, tile, index);
              } else {
                setShowOption(`tile_${index}`);
              }
            }}
            onDrag={(event, data) => {
              const tileRight = data.x + parseInt(tile.width, 10);
              if (tileRight > headerWidth) {
                setHeaderWidth(tileRight);
              }
            }}
          >
            {}
            <LazyTipTapEditor
              content={changedTitlehandle(tile)}
              onContentChange={newContent => handleContentChange(tile._id, newContent)}
              style={TitlePositionStyle(tile)}
              className='text_overlay'
              readOnly={tile.action !== 'textEditor'}
            />

            {isBackgroundImage(tile.tileBackground) && (
              <OptimizedImage
                src={tile.tileBackground}
                alt='Tile background'
                width='100%'
                height='100%'
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '10px'
                }}
                priority={index < 6}
              />
            )}

            <div
              className='showOptions absolute top-0 right-2 cursor-pointer'
              onClick={e => {
                e.stopPropagation();
                setSelectedTile(index);
                onTileClick(tile, index);
              }}
            >
              <MoreHorizSharpIcon />
            </div>

            {showOption === `tile_${index}` && (
              <div
                className='absolute top-0 right-2 cursor-pointer'
                onTouchStart={e => {
                  e.stopPropagation();
                  setSelectedTile(index);
                  onTileClick(tile, index);
                }}
              >
                <MoreHorizSharpIcon />
              </div>
            )}
          </Rnd>
        ))}
      </div>
    );
  }
);

SimpleGridTiles.displayName = 'SimpleGridTiles';

export default SimpleGridTiles;
