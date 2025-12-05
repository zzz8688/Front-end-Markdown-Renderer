import { markdownLineEnding } from 'micromark-util-character';
import { factorySpace } from 'micromark-factory-space';
import { codes, types, constants } from 'micromark-util-symbol';
import type { Construct, Tokenizer, State, Extension as MicromarkExtension } from 'micromark-util-types';
import type { Extension as FromMarkdownExtension } from 'mdast-util-from-markdown';

declare module 'micromark-util-types' {
  interface TokenTypeMap {
    spoiler: 'spoiler';
    spoilerMarker: 'spoilerMarker';
  }
}

const tokenizeMarker: Tokenizer = function(effects, ok, nok) {
  let markerSize = 0;
  
  if (this.previous === codes.exclamationMark) {
    return nok;
  }

  const start: State = function(code) {
    effects.enter('spoilerMarker');
    return marker(code);
  };

  const marker: State = function(code) {
    if (code === codes.exclamationMark) {
      effects.consume(code);
      markerSize++;
      return marker;
    }
    
    if (markerSize === 3) {
      effects.exit('spoilerMarker');
      return ok(code);
    }
    return nok(code);
  };

  return start;
};

const markerConstruct: Construct = {
  tokenize: tokenizeMarker,
  partial: true
};

const tokenizeSpoiler: Tokenizer = function(effects, ok, nok) {
  const start: State = function(code) {
    effects.enter('spoiler');
    return effects.attempt(
      markerConstruct,
      factorySpace(effects, contentStart, types.whitespace),
      nok
    )(code);
  };

  const contentStart: State = function(code) {
    effects.enter(types.chunkText, {
      contentType: constants.contentTypeText,
    });
    return content(code);
  };

  const content: State = function(code) {
    return effects.check(
      markerConstruct,
      factorySpace(effects, contentAfter, types.whitespace),
      consumeData
    )(code);
  };

  const consumeData: State = function(code) {
    if (markdownLineEnding(code) || code === codes.eof) {
      return nok(code);
    }
    effects.consume(code);
    return content;
  };

  const contentAfter: State = function(code) {
    effects.exit(types.chunkText);
    return effects.attempt(markerConstruct, after, nok)(code);
  };

  const after: State = function(code) {
    effects.exit('spoiler');
    return ok(code);
  };

  return start;
};

const spoiler: Construct = {
  name: 'spoiler',
  tokenize: tokenizeSpoiler
};

const syntax: MicromarkExtension = {
  text: {
    [codes.exclamationMark]: spoiler,
  }
};

const fromMarkdown: FromMarkdownExtension = {
  enter: {
    spoiler: function(token) {
      this.enter({
        type: 'spoiler',
        children: [],
        data: {
            hName: 'span',
            hProperties: { className: ['spoiler'] }
        }
      } as any, token);
    }
  },
  exit: {
    spoiler: function(token) {
      this.exit(token);
    }
  }
};

export default function remarkSpoiler() {
  // @ts-ignore
  const data = this.data();

  const micromarkExtensions = data.micromarkExtensions || (data.micromarkExtensions = []);
  micromarkExtensions.push(syntax);

  const fromMarkdownExtensions = data.fromMarkdownExtensions || (data.fromMarkdownExtensions = []);
  fromMarkdownExtensions.push(fromMarkdown);
}