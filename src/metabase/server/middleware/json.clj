(ns metabase.server.middleware.json
  "Middleware related to parsing JSON requests and generating JSON responses."
  (:require
   [cheshire.core :as json]
   [cheshire.factory]
   [cheshire.generate :as json.generate]
   [metabase.util.date-2 :as u.date]
   [metabase.util.log :as log]
   [ring.util.io :as rui]
   [ring.util.response :as response])
  (:import
   (com.fasterxml.jackson.core JsonGenerator)
   (java.io BufferedWriter OutputStream OutputStreamWriter)
   (java.nio.charset StandardCharsets)
   (java.time.temporal Temporal)))

(set! *warn-on-reflection* true)

;;; +----------------------------------------------------------------------------------------------------------------+
;;; |                                           JSON SERIALIZATION CONFIG                                            |
;;; +----------------------------------------------------------------------------------------------------------------+

;; Tell the JSON middleware to use a date format that includes milliseconds (why?)
(def ^:private default-date-format "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")

(alter-var-root #'cheshire.factory/default-date-format (constantly default-date-format))
(alter-var-root #'json.generate/*date-format* (constantly default-date-format))

;; ## Custom JSON encoders

(defn- write-string! [^JsonGenerator json-generator, ^String s]
  (.writeString json-generator s))

;; For java.time classes use the date util function that writes them as ISO-8601
(json.generate/add-encoder Temporal (fn [t json-generator]
                                      (write-string! json-generator (u.date/format t))))

;; Always fall back to `.toString` instead of barfing. In some cases we should be able to improve upon this behavior;
;; `.toString` may just return the Class and address, e.g. `some.Class@72a8b25e`
;; The following are known few classes where `.toString` is the optimal behavior:
;; *  `org.postgresql.jdbc4.Jdbc4Array` (Postgres arrays)
;; *  `org.bson.types.ObjectId`         (Mongo BSON IDs)
;; *  `java.sql.Date`                   (SQL Dates -- .toString returns YYYY-MM-DD)
(json.generate/add-encoder Object json.generate/encode-str)

;; Binary arrays ("[B") -- hex-encode their first four bytes, e.g. "0xC42360D7"
(json.generate/add-encoder
 (Class/forName "[B")
 (fn [byte-ar json-generator]
   (write-string! json-generator (apply str "0x" (for [b (take 4 byte-ar)]
                                                   (format "%02X" b))))))

;;; +----------------------------------------------------------------------------------------------------------------+
;;; |                                            Streaming JSON Responses                                            |
;;; +----------------------------------------------------------------------------------------------------------------+

(defn- streamed-json-response
  "Write `response-seq` to a PipedOutputStream as JSON, returning the connected PipedInputStream"
  [response-seq opts]
  (rui/piped-input-stream
   (fn [^OutputStream output-stream]
     (with-open [output-writer   (OutputStreamWriter. output-stream StandardCharsets/UTF_8)
                 buffered-writer (BufferedWriter. output-writer)]
       (try
         (json/generate-stream response-seq buffered-writer opts)
         (catch Throwable e
           (log/errorf "Error generating JSON response stream: %s" (ex-message e))
           (throw e)))))))

(defn- wrap-streamed-json-response* [opts response]
  (if-let [json-response (and (coll? (:body response))
                              (update response :body streamed-json-response opts))]
    (if (contains? (:headers json-response) "Content-Type")
      json-response
      (response/content-type json-response "application/json; charset=utf-8"))
    response))

(defn wrap-streamed-json-response
  "Similar to ring.middleware/wrap-json-response in that it will serialize the response's body to JSON if it's a
  collection. Rather than generating a string it will stream the response using a PipedOutputStream.

  Accepts the following options (same as `wrap-json-response`):

  :pretty            - true if the JSON should be pretty-printed
  :escape-non-ascii  - true if non-ASCII characters should be escaped with \\u"
  [handler & [{:as opts}]]
  (fn [request respond raise]
    (handler
     request
     (fn respond* [response]
       (respond (wrap-streamed-json-response* opts response)))
     raise)))
