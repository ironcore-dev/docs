FROM squidfunk/mkdocs-material:latest

LABEL project=ironcore_project_multi_repo_docs

WORKDIR /docs

COPY docs/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt \
    && apk add --no-cache bash

EXPOSE 8000

# Start development server by default
ENTRYPOINT ["mkdocs"]
CMD ["serve", "--dev-addr=0.0.0.0:8000"]
