"use client";
import React, { useEffect, useState } from "react";
import "./library.css";
import axios from "axios";
import { redirect } from "next/dist/server/api-utils";

function Library() {
  const [library, setLibrary] = useState([]);
  const [originalLibrary, setOriginalLibrary] = useState([]);
  const [noSearchResult, setNoSearchResult] = useState(false);
  useEffect(() => {
    axios.get("/api/template/addTemplate").then((res) => {
      setOriginalLibrary(res.data);
      setLibrary(res.data);
    });
  }, []);

  var handleSearch = (event) => {
    let searchValue = event.target.value.toLowerCase();
    if (searchValue == "") {
      setLibrary(originalLibrary);
      setNoSearchResult(false);
    } else {
      const result = originalLibrary.filter((item) =>
        item.boardName.toLowerCase().includes(searchValue)
      );
      if (result.length) {
        setLibrary(result);
      } else {
        setNoSearchResult(true);
      }
    }
  };

  const redirectToUser = (link) => {
    window.open(link, '_blank');
  }

  return (
    <div className="library-body">
      <div className="library-Style-Filter">
        <p>
          <span className="paraStyle">FILTER:</span> Most Popular, Newest,
          Oldest, A-to-Z
        </p>
        <p>
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
        </p>
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
                  <div className="filter-result" onClick={()=>{redirectToUser(data.boardLink)}}>
                    <img
                      src={data.boardImage}
                      alt="board-image"
                      className="filter-image"
                    />
                    <div>
                      <p className="paraStyle1">{data.boardName}</p>
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
  );
}

export default Library;
