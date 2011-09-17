$ = jQuery

# Constants
pieceDict =
  P: 'pawn'
  K: 'king'
  N: 'knight'
  B: 'bishop'
  R: 'rook'
  Q: 'queen'

symDict =
  pawn:   'P'
  knight: 'N'
  bishop: 'B'
  rook:   'R'
  queen:  'Q'
  king:   'K'

# Helper Methods
validSquare_  = (x,y) -> 0 < x < 9 && 0 < y < 9
toIFile       = (c)   -> 'abcdefgh'.indexOf(c) + 1
toFile        = (i)   -> 'abcdefgh'[i-1]
toFAN         = (x,y) -> "#{toFile(x)}#{y}"
toCart        = (fan) -> [toIFile(fan[0]),parseInt(fan[1])]

d = (message) ->
  console.debug message

toPiece = (c,col = false) ->
  if col
    "#{if(c.toUpperCase()==c) then 'white' else 'black'} #{pieceDict[c.toUpperCase()] || 'pawn'}"
  else
    pieceDict[c] || 'pawn'

# Plugin
$.fn.chessboard = ->
  # Instance Variables
  castle =
    black:
      long: true
      short: true
    white:
      long: true
      short: true
  enPassant         = null
  board             = $("div").addClass "jquery-chess-board"
  size              = 50 # Probably should accept a size parameter
  turn              = 'white'

  window.enPassant = ->
    enPassant

  # Private Methods
  b = (selector) -> board.find selector
  startTurn = ->
    b('.piece').draggable 'option', 'disabled', true
    b(".piece.#{turn}").draggable 'option', 'disabled', false

  placePiece = (type,coords) ->
    b(".#{coords}").data('contents',type)
    $('<div>')
      .addClass("piece #{type}")
      .width(size)
      .height(size)
      .data('pos',coords)
      .data('type',type)
      .offset
        left: (toIFile(coords[0])-1)*size
        top:  (8-parseInt(coords[1]))*size
      .appendTo board

  promotePawn = (fan) ->
    col = if fan[1] is '1' then 'black' else 'white'
    dialog = $('<div>')
    dialog
      .addClass('promotion')
      .height(size*3)
      .width(size*5)
      .offset({left:size*1.5,top:size*2.5})
      .appendTo(board)

    $('<p><strong>Promote to</strong></p>')
      .css({'line-height':"#{size}px"})
      .appendTo(dialog)

    i = 0
    for piece in ['queen','rook','bishop','knight']
      $('<div>')
        .addClass("promote piece #{piece} #{col}")
        .data('square',fan)
        .data('type',"#{col} #{piece}")
        .width(size)
        .height(size)
        .offset({left:(i+0.5)*size})
        .appendTo(dialog)
      i++

    b('.promote').click ->
      square = $(@).data('square')
      type = $(@).data('type')
      pieceAt(square).remove()
      placePiece(type,square)
      dialog.remove()
      activatePieces()
      turn = if turn is "white" then "black" else "white"
      startTurn()

  pieceAt = (coords,ignore,add) ->
    return null if coords is ignore
    return true if coords is add
    type = b(".#{coords}").data('contents')
    return null if not type?
    for elem in b(".#{type.replace(' ','.')}")
      return $(elem) if $(elem).data('pos') is coords

  movePiece = (from,to) ->
    capture = pieceAt(to)
    square = b(".#{to}")
    pieceAt(from)
      .css({'z-index':5})
      .animate {top:square.position().top,left:square.position().left}, ->
        b(".#{from}").data('contents',null)
        b(".#{to}").data('contents',$(@).data('type'))
        capture.remove() if capture?
        $(@)
          .css({'z-index':1})
          .data('oldPos',from)
          .data('pos',to)

  enemyAt_ = (coords,col,ignore,add) ->
    return true if coords is add
    return null if coords is ignore
    piece = pieceAt(coords)
    return false if not piece?
    piece.data('type').split(' ')[0] isnt col

  allyAt_ = (coords,col,ignore,add) ->
    return true if coords is add
    return null if coords is ignore
    piece = pieceAt(coords)
    return false if not piece?
    piece.data('type').split(' ')[0] is col

  activatePieces = ->
    b(".piece").draggable
      disabled: true
      revert: 'invalid'
      start: (ev,ui) ->
        candidates = candidateMoves($(@).data('type'),$(@).data('pos'))
        b(".#{$(@).data('pos')}").toggleClass 'active'
        for candidate in candidates
          b(".#{candidate}")
            .toggleClass('candidate')
            .droppable('option','disabled',false)
        $(@)
          .data('oldPos',$(@).data('pos'))
          .data('candidates',candidates)
          .css
            'z-index':5
      stop: (ev,ui) ->
        b(".#{$(@).data('oldPos')}")
          .toggleClass('active')
          .data('contents',null)
        b(".#{$(@).data('pos')}")
          .data('contents',$(@).data('type'))
        for candidate in $(@).data('candidates')
          b(".#{candidate}")
            .toggleClass('candidate')
            .droppable('option','disabled',true)
        $(@)
          .css
            'z-index':1

  pieceMoves =
    bishop: (x,y,col,threatCheck,ignore,add) ->
      returnable = []
      i = 1
      while validSquare_(x+i,y+i) and !pieceAt(toFAN(x+i,y+i),ignore,add)?
        returnable.push(toFAN(x+i,y+i))
        i++
      if validSquare_(x+i,y+i) and enemyAt_(toFAN(x+i,y+i),col,ignore,add)
        returnable.push(toFAN(x+i,y+i))
      i = 1
      while validSquare_(x+i,y-i) and !pieceAt(toFAN(x+i,y-i),ignore,add)?
        returnable.push(toFAN(x+i,y-i))
        i++
      if validSquare_(x+i,y-i) and enemyAt_(toFAN(x+i,y-i),col,ignore,add)
        returnable.push(toFAN(x+i,y-i))
      i = 1
      while validSquare_(x-i,y-i) and !pieceAt(toFAN(x-i,y-i),ignore,add)?
        returnable.push(toFAN(x-i,y-i))
        i++
      if validSquare_(x-i,y-i) and enemyAt_(toFAN(x-i,y-i),col,ignore,add)
        returnable.push(toFAN(x-i,y-i))
      i = 1
      while validSquare_(x-i,y+i) and !pieceAt(toFAN(x-i,y+i),ignore,add)?
        returnable.push(toFAN(x-i,y+i))
        i++
      if validSquare_(x-i,y+i) and enemyAt_(toFAN(x-i,y+i),col,ignore,add)
        returnable.push(toFAN(x-i,y+i))
      returnable
    knight: (x,y,col,threatCheck,ignore,add) ->
      returnable = []
      returnable.push(toFAN(x+1,y+2)) if validSquare_(x+1,y+2) and not allyAt_(toFAN(x+1,y+2),col,ignore,add)
      returnable.push(toFAN(x+2,y+1)) if validSquare_(x+2,y+1) and not allyAt_(toFAN(x+2,y+1),col,ignore,add)
      returnable.push(toFAN(x+2,y-1)) if validSquare_(x+2,y-1) and not allyAt_(toFAN(x+2,y-1),col,ignore,add)
      returnable.push(toFAN(x+1,y-2)) if validSquare_(x+1,y-2) and not allyAt_(toFAN(x+1,y-2),col,ignore,add)
      returnable.push(toFAN(x-1,y-2)) if validSquare_(x-1,y-2) and not allyAt_(toFAN(x-1,y-2),col,ignore,add)
      returnable.push(toFAN(x-2,y-1)) if validSquare_(x-2,y-1) and not allyAt_(toFAN(x-2,y-1),col,ignore,add)
      returnable.push(toFAN(x-2,y+1)) if validSquare_(x-2,y+1) and not allyAt_(toFAN(x-2,y+1),col,ignore,add)
      returnable.push(toFAN(x-1,y+2)) if validSquare_(x-1,y+2) and not allyAt_(toFAN(x-1,y+2),col,ignore,add)
      returnable
    queen:  (x,y,col,threatCheck,ignore,add) ->
      @bishop(x,y,col,threatCheck,ignore,add).concat @rook(x,y,col,threatCheck,ignore,add)
    king:   (x,y,col,threatCheck,ignore,add) ->
      returnable = []
      returnable.push(toFAN(x  ,y+1)) if validSquare_(x  ,y+1) and not allyAt_(toFAN(x  ,y+1),col,ignore,add)
      returnable.push(toFAN(x+1,y+1)) if validSquare_(x+1,y+1) and not allyAt_(toFAN(x+1,y+1),col,ignore,add)
      returnable.push(toFAN(x+1,y  )) if validSquare_(x+1,y  ) and not allyAt_(toFAN(x+1,y  ),col,ignore,add)
      returnable.push(toFAN(x+1,y-1)) if validSquare_(x+1,y-1) and not allyAt_(toFAN(x+1,y-1),col,ignore,add)
      returnable.push(toFAN(x  ,y-1)) if validSquare_(x  ,y-1) and not allyAt_(toFAN(x  ,y-1),col,ignore,add)
      returnable.push(toFAN(x-1,y-1)) if validSquare_(x-1,y-1) and not allyAt_(toFAN(x-1,y-1),col,ignore,add)
      returnable.push(toFAN(x-1,y  )) if validSquare_(x-1,y  ) and not allyAt_(toFAN(x-1,y  ),col,ignore,add)
      returnable.push(toFAN(x-1,y+1)) if validSquare_(x-1,y+1) and not allyAt_(toFAN(x-1,y+1),col,ignore,add)
      unless threatCheck
        opCol = if col is 'white' then 'black' else 'white'
        returnable.push(toFAN(x+2,y)) if castle[col]['short'] and (!pieceAt(toFAN(x+1,y))?) and (!pieceAt(toFAN(x+2,y))?) and (!threatens_(toFAN(x,y),opCol)) and (!threatens_(toFAN(x+1,y),opCol)) and (!threatens(toFAN(x+2,y),opCol))
        returnable.push(toFAN(x-2,y)) if castle[col]['long'] and (!pieceAt(toFAN(x-1,y))?) and (!pieceAt(toFAN(x-2,y))?) and (!pieceAt(toFAN(x-3,y))) and (!threatens_(toFAN(x,y),opCol)) and (!threatens_(toFAN(x-1,y),opCol)) and (!threatens(toFAN(x-2,y),opCol))
      returnable
    pawn:   (x,y,col,threatCheck,ignore,add) ->
      returnable = []
      yMod = if col is "white" then 1 else -1
      unless threatCheck
        unless pieceAt(toFAN(x,y+yMod))?
          returnable.push(toFAN(x,y+yMod))
          if y is (if col is "white" then 2 else 7) and not pieceAt(toFAN(x+yMod*2),ignore,add)
            returnable.push(toFAN(x,y+yMod*2))
      returnable.push(toFAN(x+1,y+yMod)) if x < 8 and (enemyAt_(toFAN(x+1,y+yMod),col,ignore,add) or threatCheck) or (enPassant is toFAN(x+1,y+yMod))
      returnable.push(toFAN(x-1,y+yMod)) if x > 1 and (enemyAt_(toFAN(x-1,y+yMod),col,ignore,add) or threatCheck) or (enPassant is toFAN(x-1,y+yMod))
      returnable
    rook:   (x,y,col,ignore,add) ->
      returnable = []
      i = 1
      while validSquare_(x,y+i) and !pieceAt(toFAN(x,y+i),ignore,add)?
        returnable.push(toFAN(x,y+i))
        i++
      if validSquare_(x,y+i) and enemyAt_(toFAN(x,y+i),col,ignore,add)
        returnable.push(toFAN(x,y+i))
      i = 1
      while validSquare_(x+i,y) and !pieceAt(toFAN(x+i,y),ignore,add)?
        returnable.push(toFAN(x+i,y))
        i++
      if validSquare_(x+i,y) and enemyAt_(toFAN(x+i,y),col,ignore,add)
        returnable.push(toFAN(x+i,y))
      i = 1
      while validSquare_(x,y-i) and !pieceAt(toFAN(x,y-i),ignore,add)?
        returnable.push(toFAN(x,y-i))
        i++
      if validSquare_(x,y-i) and enemyAt_(toFAN(x,y-i),col,ignore,add)
        returnable.push(toFAN(x,y-i))
      i = 1
      while validSquare_(x-i,y) and !pieceAt(toFAN(x-i,y),ignore,add)?
        returnable.push(toFAN(x-i,y))
        i++
      if validSquare_(x-i,y) and enemyAt_(toFAN(x-i,y),col,ignore,add)
        returnable.push(toFAN(x-i,y))
      returnable

  candidateMoves = (type,fan,threatCheck,ignore,add) ->
    verified = []
    [x,y] = toCart(fan)
    typeArray = type.split(' ')
    candidates = pieceMoves[typeArray[1]](x,y,typeArray[0],threatCheck,ignore,add)
    return candidates if threatCheck
    opCol = if typeArray[0] is 'white' then 'black' else 'white'
    if typeArray[1] is 'king'
      for move in candidates
        verified.push move unless threatens_(move,opCol)
      return verified
    for move in candidates
      verified.push move unless threatens_(b(".king.#{typeArray[0]}").data('pos'),opCol,fan,move)
    verified

  threatens_ = (square,color,ignore,add) ->
    for piece in b(".piece.#{color}")
      unless $(piece).data('pos') is add
        return true if square in candidateMoves($(piece).data('type'),$(piece).data('pos'),true,ignore,add)
    false

  # Public Methods
  handler =
    reset: ->
      b('.piece').remove()
      b('.square').data('contents',null)

    getFEN: ->
      returnable = ''
      for rank in [8..1]
        counter = 0
        for file in 'abcdefgh'
          if b(".#{file}#{rank}").data('contents')
            typeArray = b(".#{file}#{rank}").data('contents').split(' ')
            returnable += counter if counter > 0
            counter = 0
            if typeArray[0] is 'white'
              returnable += symDict[typeArray[1]]
            else
              returnable += symDict[typeArray[1]].toLowerCase()
          else
            counter++
        returnable += counter if counter > 0
        returnable += '/' if rank > 1
      returnable

    setFEN: (fenString) ->
      # NOTE: At present, this only reads the 
      # first four parameters of FEN notation
      # http://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
      @reset
      fen = fenString.split ' '

      castle['black']['short'] = 'k' in fen[2]
      castle['white']['short'] = 'K' in fen[2]
      castle['black']['long']  = 'q' in fen[2]
      castle['white']['long']  = 'Q' in fen[2]

      enPassant = if fen[3] is '-' then null else fen[3]

      turn = if fen[1]=='w' then 'white' else 'black'

      i = 0
      for c in fen[0].split ''
        continue if c is '/'
        if parseInt c
          i += parseInt(c)
        else
          placePiece(toPiece(c,true),toFile((i%8)+1) + (8-(Math.floor(i/8))))
          i++

    movePGN: (move) ->
      castleRank = if turn is 'white' then 1 else 8

  # Main
  $(@).addClass('jquery-chess-wrapper').css({background:'transparent'})
  board.height(size*8).width(size*8).appendTo(@)

  # Create Squares
  for i in [0..63]
    coord = toFile((i%8)+1) + (8-(Math.floor(i/8)))
    $('<div>')
      .addClass("square #{if (i+Math.floor(i/8))%2==0 then 'light' else 'dark'} #{coord}")
      .width(size)
      .height(size)
      .data('pos',coord)
      .offset({top:Math.floor(i/8)*size,left:i%8*size})
      .appendTo(board)

  b('.square').droppable
    disabled: true
    drop: (ev,ui) ->
      ui.draggable.offset($(@).offset())
      ui.draggable.data('pos',$(@).data('pos'))
      typeArray = ui.draggable.data('type').split(' ')
      ep = null
      promote = null

      if typeArray[1] is "pawn"
        if $(@).data('pos')[1] in ['1','8']
          promote = true
          promotePawn($(@).data('pos'))
        if $(@).data('pos') is enPassant
          pieceAt("#{enPassant[0]}#{if enPassant[1] is '6' then '5' else '4'}").remove()
          b(".#{enPassant[0]}#{if enPassant[1] is '6' then '5' else '4'}").data('contents',null)
        if Math.abs(parseInt(ui.draggable.data('oldPos')[1])-parseInt($(@).data('pos')[1])) is 2
          [x,y] = toCart($(@).data('pos'))
          opCol = if typeArray[0] is 'white' then 'black' else 'white'
          if (validSquare_(x+1,y) and pieceAt(toFAN(x+1,y))?.data('type') is "#{opCol} pawn") or (validSquare_(x-1,y) and pieceAt(toFAN(x-1,y))?.data('type') is "#{opCol} pawn")
            ep = toFAN(x,y+(if typeArray[0] is 'white' then -1 else 1))

      enPassant = ep

      if typeArray[1] is 'king'
        castle[typeArray[0]]['short'] = false
        castle[typeArray[0]]['long']  = false
        if ui.draggable.data('oldPos')[0] is 'e'
          rank = $(@).data('pos')[1]
          movePiece('h'+rank,'f'+rank) if $(@).data('pos')[0] is 'g'
          movePiece('a'+rank,'d'+rank) if $(@).data('pos')[0] is 'c'

      if typeArray[1] is 'rook'
        rank = if typeArray[0] is 'white' then 1 else 8
        if castle[typeArray[0]]['short'] and ui.draggable.data('oldPos') is "h#{rank}"
          castle[typeArray[0]]['short'] = false
        if castle[typeArray[0]]['long'] and ui.draggable.data('oldPos') is "a#{rank}"
          castle[typeArray[0]]['long'] = false

      pieceAt($(@).data('pos')).remove() if $(@).data('contents')

      unless promote?
        turn = if turn is "white" then "black" else "white"
        startTurn()

  handler.setFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
  activatePieces()
  startTurn()
     
  # Return Handler
  handler
