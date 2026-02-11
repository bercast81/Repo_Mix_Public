# Drive Your City

## Setup

* Run `docker compose -f docker-compose.yml up -d --build`
* For each service access to the folder and execute the following commands, be sure to run each server in a separate terminal, for example: 
  ```sh
  cd dock-service
  yarn install
  yarn run db:gen
  yarn run proto:gen
  tarn run start:serve
  ```
