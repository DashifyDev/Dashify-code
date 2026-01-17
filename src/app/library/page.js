'use client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { globalContext } from '@/context/globalContext';
import useAdmin from '@/hooks/isAdmin';
import { dashboardKeys } from '@/hooks/useDashboard';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

function Library() {
  const [library, setLibrary] = useState([]);
  const [originalLibrary, setOriginalLibrary] = useState([]);
  const [noSearchResult, setNoSearchResult] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('mostPopular');
  const [loadingBoardId, setLoadingBoardId] = useState(null); // Track which board is loading
  const { dbUser, setBoards, boards, setTiles } = useContext(globalContext);
  const queryClient = useQueryClient();
  const isAdmin = useAdmin();
  const router = useRouter();

  const filterOption = [
    { id: 'mostPopular', filter: 'Most Popular' },
    { id: 'newest', filter: 'Newest' },
    { id: 'aToz', filter: 'A-to-Z' }
  ];

  useEffect(() => {
    axios.get(`/api/template/addTemplate?filter=${selectedFilter}`).then(res => {
      setOriginalLibrary(res.data);
      setLibrary(res.data);
      setNoSearchResult(false);
    });
  }, [selectedFilter]);

  // useEffect(() => {
  //   (async () => {
  //     console.log("boards", boards)
  //     console.log("library", library)
  //     if (boards && boards.length > 0 && library && library.length > 0) {
  //     // 6504db17947e478445e2ccee
  //     // 650763be47114b00ebe9dde8

  //     const travel = boards.find(el => el.name === "Travel")
  //     const responseTravel = await fetch(`/api/dashboard/${travel._id}`).then(res => res.json())
  //     const kids = boards.find(el => el.name === "Davi")
  //     const responseKids = await fetch(`/api/dashboard/${kids._id}`).then(res => res.json())

  //     console.log("responseTravel", responseTravel)
  //     console.log("responseKids", responseKids)

  //     // const res1 = await axios.post("/api/tile/tiles", { dashboardId: "6504db17947e478445e2ccee", tiles: responseTravel.tiles })
  //     // console.log("res1", res1)
  //     // const res2 = await axios.post("/api/tile/tiles", { dashboardId: "650763be47114b00ebe9dde8", tiles: responseKids.tiles })
  //     // console.log("res2", res2)
  //     }
  //   })()
  // }, [boards, library])

  const selectFilter = async id => {
    setSelectedFilter(id);
    const result = await axios.get(`/api/template/addTemplate?filter=${id}`);
    setOriginalLibrary(result.data);
    setLibrary(result.data);
    setNoSearchResult(false);
  };

  var handleSearch = event => {
    let searchValue = event.target.value.toLowerCase();
    if (searchValue == '') {
      setLibrary(originalLibrary);
      setNoSearchResult(false);
    } else {
      const result = originalLibrary.filter(item =>
        item.boardName.toLowerCase().includes(searchValue)
      );
      const keywordsSearch = originalLibrary
        .map(item => ({
          ...item,
          keywords: item.keywords.filter(item => item.toLowerCase().includes(searchValue))
        }))
        .filter(elements => elements.keywords.length > 0);
      if (result.length) {
        setLibrary(result);
      } else if (keywordsSearch.length) {
        setLibrary(keywordsSearch);
      } else {
        setNoSearchResult(true);
      }
    }
  };

  const redirectToUser = link => {
    window.open(link, '_blank');
  };

  const handleBoardClick = async data => {
    const boardId = data.boardLink.split('/').pop();
    setLoadingBoardId(boardId);

    try {
      const response = await axios.get(`/api/dashboard/${boardId}`);
      let payload;
      if (dbUser) {
        if (isAdmin) {
          payload = {
            name: response.data.name,
            userId: dbUser._id,
            hasAdminAdded: true
          };
        } else {
          payload = {
            name: response.data.name,
            userId: dbUser._id
          };
        }
        axios
          .post('/api/dashboard/addDashboard', payload)
          .then(res => {
            const newBoard = res.data;

            const boardTiles = response.data.tiles.map(el => {
              const tileCopy = { ...el };
              delete tileCopy._id;
              tileCopy.dashboardId = newBoard._id;
              return tileCopy;
            });

            axios
              .post('/api/tile/tiles', {
                dashboardId: newBoard._id,
                tiles: boardTiles
              })
              .then(resp => {
                setTiles(resp.data.tiles);
                newBoard.tiles = resp.data.tiles;
                setBoards(prev => [...prev, newBoard]);

                try {
                  queryClient.invalidateQueries({
                    queryKey: dashboardKeys.lists()
                  });
                  queryClient.setQueryData(dashboardKeys.detail(newBoard._id), newBoard);
                } catch (e) {
                  console.warn('Failed to update query cache after creating dashboard', e);
                }
                setLoadingBoardId(null);
                router.push(`/dashboard/${newBoard._id}`);
              })
              .catch(err => {
                console.error('Error creating tiles:', err);
                setLoadingBoardId(null);
              });
          })
          .catch(err => {
            console.error('Error creating dashboard:', err);
            setLoadingBoardId(null);
          });
      } else {
        const boardId = uuidv4();
        const newTiles = response.data.tiles.map(tile => {
          tile._id = uuidv4();
          tile.dashboardId = boardId;
          return tile;
        });
        let payload = {
          _id: boardId,
          name: response.data.name,
          tiles: newTiles
        };
        let items = boards;
        items = [...items, payload];
        localStorage.setItem('Dasify', JSON.stringify(items));
        setBoards(items);
        setTiles(newTiles);

        try {
          const detailKey = dashboardKeys.detail(boardId);
          queryClient.setQueryData(detailKey, oldData => {
            if (oldData) {
              return {
                ...oldData,
                tiles: payload.tiles
              };
            }
            return {
              _id: payload._id,
              name: payload.name || '',
              tiles: payload.tiles,
              pods: payload.pods || []
            };
          });
        } catch (e) {
          console.warn('Failed to update query cache for local board', e);
        }

        setLoadingBoardId(null);
        router.push(`/dashboard/${boardId}`);
      }
    } catch (error) {
      console.error('Error loading board:', error);
      setLoadingBoardId(null);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12'>
        {/* Header */}
        <div className='mb-8 sm:mb-12'>
          <h1 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-[#63899e] mb-2'>
            Boards Library
          </h1>
          <p className='text-gray-600 text-sm sm:text-base'>
            Discover and add beautiful dashboard templates to your Boardzy
          </p>
        </div>

        {/* Filters and Search */}
        <div className='mb-8 space-y-6'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
            {/* Filter Buttons */}
            <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
              <span className='text-sm font-semibold text-gray-700 whitespace-nowrap hidden sm:block'>
                Filter:
              </span>
              <div className='inline-flex items-center rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-1.5 gap-1.5 shadow-inner border border-gray-200/50'>
                {filterOption.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => selectFilter(filter.id)}
                    className={`relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ease-in-out border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#63899e] focus-visible:ring-offset-2 ${
                      selectedFilter === filter.id
                        ? 'bg-gradient-to-r from-[#63899e] to-[#4a6d7e] text-white shadow-lg shadow-[#63899e]/30 scale-105'
                        : 'text-gray-600 hover:text-[#63899e] hover:bg-white/60 active:scale-95'
                    }`}
                  >
                    {selectedFilter === filter.id && (
                      <span className='absolute inset-0 rounded-lg bg-white/20 animate-pulse' />
                    )}
                    <span className='relative z-10'>{filter.filter}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className='flex items-center gap-3 w-full lg:w-auto'>
              <span className='text-sm font-semibold text-gray-700 whitespace-nowrap hidden sm:block'>
                Search:
              </span>
              <div className='relative flex-1 lg:flex-initial lg:w-64'>
                <div className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#63899e] pointer-events-none z-10'>
                  <svg
                    fill='none'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2.5'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                  </svg>
                </div>
                <Input
                  type='text'
                  placeholder='Search boards...'
                  onChange={handleSearch}
                  className='pl-10 pr-4 h-10 w-full bg-white border-gray-300 rounded-lg shadow-sm hover:shadow-md focus:shadow-md focus:border-[#63899e] transition-all duration-200 text-sm placeholder:text-gray-400'
                />
              </div>
            </div>
          </div>
        </div>

        {/* Board Cards Grid */}
        {noSearchResult ? (
          <div className='flex flex-col items-center justify-center py-16 sm:py-24'>
            <div className='text-center'>
              <svg
                className='mx-auto h-16 w-16 sm:h-24 sm:w-24 text-gray-400 mb-4'
                fill='none'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='1.5'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              <h3 className='text-xl sm:text-2xl font-semibold text-gray-700 mb-2'>
                No Results Found
              </h3>
              <p className='text-gray-500 text-sm sm:text-base'>
                Try adjusting your search or filter criteria
              </p>
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {library.map((data, index) => {
              const boardId = data.boardLink.split('/').pop();
              const isLoading = loadingBoardId === boardId;

              return (
                <Card
                  key={index}
                  className='group cursor-pointer overflow-hidden relative transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 border border-gray-200/60 bg-white/95 backdrop-blur-sm'
                  onClick={() => handleBoardClick(data)}
                >
                  {/* Loading Overlay */}
                  {isLoading && (
                    <div className='absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl'>
                      <LoadingSpinner size='medium' text='Loading board...' />
                    </div>
                  )}
<CardTitle className='text-xl sm:text-2xl line-clamp-2 group-hover:text-[#4a6d7e] transition-colors px-4'>
                      {data.boardName}
                    </CardTitle>
                  {/* Image */}
                  <div className='relative w-full h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100'>
                    <div className='absolute inset-0 bg-gradient-to-t from-black/5 to-transparent z-10' />
                    <Image
                      src={data.boardImage}
                      alt={data.boardName || 'board-image'}
                      fill
                      className='object-cover group-hover:scale-110 transition-transform duration-500 ease-out'
                      sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                    />
                  </div>

                  {/* Content */}
                  <CardHeader className='pb-4'>
                    
                    <CardDescription className='text-sm sm:text-base line-clamp-3 mt-2 text-gray-600'>
                      {data.boardDescription}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className='pt-0'>
                    {/* Keywords */}
                    <div className='flex flex-wrap gap-2'>
                      {data.keywords.slice(0, 4).map((keyword, idx) => (
                        <Badge
                          key={idx}
                          variant='secondary'
                          className='text-xs bg-gray-100/80 text-gray-700 hover:bg-gray-200/80 border border-gray-200/50 transition-colors'
                        >
                          {keyword}
                        </Badge>
                      ))}
                      {data.keywords.length > 4 && (
                        <Badge variant='outline' className='text-xs border-gray-300/60'>
                          +{data.keywords.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Library;
