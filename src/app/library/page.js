"use client";
import React, { useEffect, useState } from "react";
import "./library.css";
import axios from "axios";

function Library() {
  const [library, setLibrary] = useState([]);
  const [originalLibrary, setOriginalLibrary] = useState([]);
  const [noSearchResult, setNoSearchResult] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("mostPopular");

  const filterOption = [
    { id: "mostPopular", filter: "Most Popular" },
    { id: "newest", filter: "Newest" },
    { id: "aToz", filter: "A-to-Z" },
  ];

  useEffect(() => {
    axios
      .get(`/api/template/addTemplate?filter=${selectedFilter}`)
      .then((res) => {
        setOriginalLibrary(res.data);
        setLibrary(res.data);
      });
  }, []);

  const selectFilter = async (id) => {
    setSelectedFilter(id);
    const result = await axios.get(`/api/template/addTemplate?filter=${id}`);
    setLibrary(result.data);
  };

  var handleSearch = (event) => {
    let searchValue = event.target.value.toLowerCase();
    if (searchValue == "") {
      setLibrary(originalLibrary);
      setNoSearchResult(false);
    } else {
      const result = originalLibrary.filter((item) =>
        item.boardName.toLowerCase().includes(searchValue)
      );
      const keywordsSearch = originalLibrary
        .map((item) => ({
          ...item,
          keywords: item.keywords.filter((item) =>
            item.toLowerCase().includes(searchValue)
          ),
        }))
        .filter((elements) => elements.keywords.length > 0);
      if (result.length) {
        setLibrary(result);
      }else if(keywordsSearch.length){
        setLibrary(keywordsSearch)
      }
       else {
        setNoSearchResult(true);
      }
    }
  };

  const redirectToUser = (link) => {
    window.open(link, "_blank");
  };

  return (
    <div className="library">
      <div className="library-board-heading">
        <h1>Boards Library</h1>
      </div>
      <div className="library-body">
        <div className="library-Style-Filter">
          <h2>
            <span className="paraStyle">FILTER:</span>
            {filterOption.map((filter, index) => (
              <span
                onClick={() => {
                  selectFilter(filter.id);
                }}
                key={filter.id}
                style={{
                  fontWeight: selectedFilter === filter.id ? 700 : 200,
                  textDecoration:
                    selectedFilter === filter.id ? "underline" : "none",
                  marginLeft: "5px",
                  cursor: "pointer",
                }}
              >
                {filter.filter}
              </span>
            ))}
          </h2>
          <h2>
            <span className="paraStyle">
              SEARCH:
              <input
                className="input-style"
                placeholder="Search Boards"
                onChange={(e) => {
                  handleSearch(e);
                }}
              />
            </span>
          </h2>
        </div>
        <div className="lib_container">
          {noSearchResult ? (
            <div>
              <hr />
              <div>
                <h3>No Result Found</h3>
              </div>
            </div>
          ) : (
            <>
              {library.map((data, index) => {
                return (
                  <div key={index}>
                    <hr />
                    <div
                      className="filter-result"
                      onClick={() => {
                        redirectToUser(data.boardLink);
                      }}
                    >
                      <img
                        src={data.boardImage}
                        alt="board-image"
                        className="filter-image"
                      />
                      <div className="board-details">
                        <h2 className="paraStyle1">{data.boardName}</h2>
                        <p>{data.boardDescription}</p>
                        <small>
                          <span className="paraStyle">Keywords: </span>
                          {data.keywords.join(",")}
                        </small>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Library;
