import React from 'react';
import "./css/toc.scss"
import chapters from "./chapters.json"
import {bookState} from "./book/store";
import terms from "./terms.json"
import {NOMBRE_APP} from "./local/perfil";

export const TableOfContents = () => {
  const current = bookState.user.pageSlug;
  return (
    <div className="backend bg-dark toc">
      <div className="toc-header">
        <div className="container">
          <a href={"#" + current} className="btn btn-outline-light btn-sm mb-3">&larr; Volver a la lección</a>
          <h1>{NOMBRE_APP}</h1>
          <div dangerouslySetInnerHTML={{__html: terms.toc_instructions}}/>
        </div>
      </div>

      <div className="container toc-container">
        <div className="row">
          <div className="col-md-9" role="main">
            <div className="toc-section">
              <h1 id="toc-toc">
                {terms.table_of_contents}
              </h1>
              <ol className="toc-ol">
                {chapters.map(chapter =>
                  <li>
                    <h2>{chapter.title}</h2>
                    <ol>
                      {chapter.pages.map(page => {
                        const isCurrent = page.slug === current;
                          return <li key={page.slug}>
                            <a href={"#" + page.slug}
                               style={isCurrent ? {
                                 border: '2px solid white',
                                 fontWeight: 'bold',
                                 padding: '5px',
                                 lineHeight: 2
                               } : {}}
                              // May have HTML generated from markdown
                               dangerouslySetInnerHTML={{__html: page.title}}/>
                            {isCurrent && ` ${terms.current_page}`}
                          </li>;
                        }
                      )}
                    </ol>
                  </li>
                )}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
